import { spawn } from "child_process";
import { rmSync } from "fs";
import { resolve } from "path";
import { connect } from "node:net";
import { tmpdir } from "os";
import { upsertWatchedPosition } from "@/lib/db";

// Ensure Homebrew binaries (like mpv) can be found in non-interactive environments
process.env.PATH = `${process.env.PATH || ""}:/opt/homebrew/bin:/usr/local/bin`;

// ---------- Syncplay configuration ----------
export interface SyncplayConfig {
  host: string;
  room: string;
  user: string;
  pass?: string;
}



// Converts "HH:MM:SS" / "MM:SS" / "SS" -> total seconds
function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const filename = pathname.split("/").pop() || "stream";
    return filename.length > 80 ? filename.slice(0, 80) + "..." : filename;
  } catch {
    return "stream";
  }
}

// Command builders per player. Add more entries here to support other players.
// Each builder returns the executable to spawn + its argv.
export const players: Record<
  string,
  (url: string, startTime: string, opts?: { socketPath?: string }) => { cmd: string; args: string[] }
> = {
  mpv: (url, startTime, opts) => ({
    cmd: "mpv",
    args: opts?.socketPath
      ? [url, `--start=${startTime}`, `--input-ipc-server=${opts.socketPath}`]
      : [url, `--start=${startTime}`],
  }),
  vlc: (url, startTime) => ({
    cmd: process.platform === "darwin" ? "/Applications/VLC.app/Contents/MacOS/vlc" : "vlc",
    args: [url, `--start-time=${timeToSeconds(startTime)}`],
  }),
  iina: (url, startTime) => ({
    // IINA's CLI tool (installed separately: `brew install --cask iina-cli` or via IINA app menu)
    cmd: "iina",
    args: [url, `--mpv-start=${startTime}`],
  }),
};

export function resolveCommand(player: string, url: string, startTime: string, opts?: { socketPath?: string }) {
  const builder = players[player.toLowerCase()];
  if (builder) return builder(url, startTime, opts);
  // Unknown player name: treat it as the literal executable and just pass the url.
  return { cmd: player, args: [url] };
}

// ---------- mpv resume monitoring ----------

export interface MpvMonitorOptions {
  userId: number;
  accountId: number;
  torrentId: number;
  fileId: number;
}

// mpv creates the IPC socket itself; the daemon connects as a client.
// Windows uses named pipes (no /tmp), posix uses a socket file.
export function buildMpvSocketPath(torrentId?: number, fileId?: number): string {
  const rand = Math.random().toString(36).slice(2, 8);
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\mpv_relay_${torrentId ?? "x"}_${fileId ?? "x"}_${rand}`;
  }
  return resolve(tmpdir(), `mpv_relay_${torrentId ?? "x"}_${fileId ?? "x"}_${rand}.sock`);
}

// Listens for mpv property-change / end-file events over the IPC socket and
// reports playback position back to the server. Fire-and-forget; failures are
// logged and never crash the daemon.
export function monitorMpv(socketPath: string, opts: MpvMonitorOptions) {
  let client: ReturnType<typeof connect> | null = null;
  let buffer = "";
  let lastPos = 0;
  let lastDuration: number | null = null;
  let lastReported = 0;
  let playing = true;
  let connected = false;
  let reportInterval: ReturnType<typeof setInterval> | null = null;
  let finished = false;

  const report = (position: number, duration: number | null, completed: boolean) => {
    if (finished) return;
    lastReported = position;

    const withinLastMinute = duration != null && duration > 0 && position >= duration - 60;
    const isCompleted = completed || withinLastMinute;
    
    try {
      upsertWatchedPosition(
        opts.userId,
        opts.accountId,
        opts.torrentId,
        opts.fileId,
        Math.max(0, position),
        duration ?? null,
        isCompleted
      );
    } catch (e) {
      console.error(`[${new Date().toISOString()}] mpv DB upsert error:`, e);
    }
  };

  const teardown = () => {
    if (finished) return;
    finished = true;
    if (reportInterval) {
      clearInterval(reportInterval);
      reportInterval = null;
    }
    if (client) {
      try { client.destroy(); } catch { /* ignore */ }
    }
    if (process.platform !== "win32") {
      try { rmSync(socketPath, { force: true }); } catch { /* ignore */ }
    }
  };

  const handleMessage = (msg: any) => {
    if (msg.event === "property-change") {
      if (msg.id === 1 && typeof msg.data === "number") {
        // time-pos fires many times/sec — just cache it (debounced via interval)
        lastPos = msg.data;
      } else if (msg.id === 2 && typeof msg.data === "boolean") {
        playing = !msg.data;
        if (msg.data === true) report(lastPos, lastDuration, false);
      } else if (msg.id === 3 && typeof msg.data === "number") {
        lastDuration = msg.data;
      }
    } else if (msg.event === "end-file") {
      if (msg.reason === "eof") {
        report(lastDuration ?? lastPos, lastDuration, true);
      } else {
        // quit / stop / redirect / error / unknown — keep last known position
        report(lastPos, lastDuration, false);
      }
      teardown();
    }
  };

  const attemptConnect = (attempt = 0) => {
    if (finished) return;
    const sock = connect(socketPath);
    client = sock;
    sock.setEncoding("utf8");

    sock.on("connect", () => {
      connected = true;
      sock.write('{"command":["observe_property", 1, "time-pos"]}\n');
      sock.write('{"command":["observe_property", 2, "pause"]}\n');
      sock.write('{"command":["observe_property", 3, "duration"]}\n');
      // Periodic checkpoint every 15s (covers crash/kill/machine sleep)
      reportInterval = setInterval(() => {
        if (playing && Math.abs(lastPos - lastReported) >= 5) {
          report(lastPos, lastDuration, false);
        }
      }, 15000);
    });

    sock.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          handleMessage(JSON.parse(line));
        } catch {
          // ignore malformed lines
        }
      }
    });

    sock.on("error", (err) => {
      if (finished) return;
      // mpv creates the socket shortly after spawn — retry until it exists.
      if (!connected) {
        const code = (err as NodeJS.ErrnoException).code;
        if ((code === "ENOENT" || code === "ECONNREFUSED" || code === "EPIPE") && attempt < 30) {
          setTimeout(() => attemptConnect(attempt + 1), 100);
          return;
        }
      }
      console.error(`[${new Date().toISOString()}] mpv IPC error:`, err.message);
    });

    sock.on("close", () => {
      connected = false;
      if (reportInterval) {
        clearInterval(reportInterval);
        reportInterval = null;
      }
    });
  };

  attemptConnect();
}
