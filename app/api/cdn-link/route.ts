import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { verifyUserAccountAccess, getUserSetting } from "@/lib/db";
import { getValidAccessToken, requestCdnLink } from "@/lib/torbox";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";
import { toast } from "sonner";
import { spawn } from "child_process";

const cdnLinkSchema = z.object({
  torrent_id: z.number().int().nonnegative(),
  file_id: z.number().int().nonnegative(),
  account_id: z.number().int().positive(),
  cdnLinkRequired: z.boolean().optional(),
  player: z.string().optional(),
  syncplay: z.boolean().optional()
});

interface SyncplayConfig {
  host: string;
  room: string;
  user: string;
  pass?: string;
}

const commands = process.platform === "darwin" ? {
  "mpv": "/opt/homebrew/bin/mpv",
  "vlc": "/Applications/VLC.app/Contents/MacOS/vlc",
  "iina": "/Applications/IINA.app/Contents/MacOS/IINA",
  "syncplay": "/Applications/Syncplay.app/Contents/MacOS/syncplay"
} : {
  "mpv": "mpv",
  "vlc": "vlc",
  "iina": "iina",
  "syncplay": "syncplay"
};

const players: Record<
  string,
  (url: string) => { cmd: string; args: string[] }
> = {
  mpv: (url) => ({
    cmd: commands.mpv,
    args: [url],
  }),
  vlc: (url) => ({
    cmd: commands.vlc,
    args: [url],
  }),
  iina: (url) => ({
    // IINA's CLI tool (installed separately: `brew install --cask iina-cli` or via IINA app menu)
    cmd: commands.iina,
    args: [url],
  }),
};

function resolveCommand(player: string, url: string) {
  const builder = players[player.toLowerCase()];
  if (builder) return builder(url);
  // Unknown player name: treat it as the literal executable and just pass the url.
  return { cmd: player, args: [url] };
}

function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const filename = pathname.split("/").pop() || "stream";
    return filename.length > 80 ? filename.slice(0, 80) + "..." : filename;
  } catch {
    return "stream";
  }
}

const LOCAL_DAEMON_PLAYERS = ["mpv", "vlc", "iina"];

function loadSyncplayConfig(userId?: number): SyncplayConfig | null {
  const isProd = process.env.IS_PACKAGED === 'true';

  if (isProd && userId) {
    const host = getUserSetting(userId, "SYNCPLAY_HOST");
    const room = getUserSetting(userId, "SYNCPLAY_ROOM");
    const user = getUserSetting(userId, "SYNCPLAY_USER");
    if (!host || !room || !user) {
      console.warn("User has missing required syncplay keys in database");
      return null;
    }
    return { host, room, user, pass: getUserSetting(userId, "SYNCPLAY_PASS") || undefined };
  }

  // Look for syncplay.conf in the project root
  const confPath = resolve(process.cwd(), "syncplay.conf");
  if (!existsSync(confPath)) {
    console.warn(`Syncplay.conf not found at ${confPath} — Syncplay endpoint will fail.`);
    return null;
  }

  const raw = readFileSync(confPath, "utf8");
  const map: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    map[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }

  const host = map.SYNCPLAY_HOST;
  const room = map.SYNCPLAY_ROOM;
  const user = map.SYNCPLAY_USER;
  if (!host || !room || !user) {
    console.warn("syncplay.conf is missing required keys (SYNCPLAY_HOST, SYNCPLAY_ROOM, SYNCPLAY_USER)");
    return null;
  }

  return { host, room, user, pass: map.SYNCPLAY_PASS || undefined };
}

const handleStream = async (url: string, player: string) => {
  if (LOCAL_DAEMON_PLAYERS.includes(player)) {
    try {
      const { cmd, args } = resolveCommand(player, url);
      const proc = spawn(cmd, args, {
        detached: true
      });
      proc.unref();
      proc.on("error", (err) => {
        console.error(`[${new Date().toISOString()}] Spawn error for "${cmd}":`, err.message);
      });

      const displayUrl = args[0] ? extractFilename(args[0]) : "unknown";
      console.log(`[${new Date().toISOString()}] Launched: ${cmd} "${displayUrl}"`);
    } catch (err) {
      const errMessage = (err as Error).message;
      toast.error("Failed to launch player");
      console.error(errMessage ?? err);
      return;
    }
  }
};

const handleSyncplay = async (url: string, player: string, userId: number) => {
  if (!LOCAL_DAEMON_PLAYERS.includes(player)) return;
  try {

    let syncplayConfig = loadSyncplayConfig(userId);
    if (!syncplayConfig) {
      toast.error('Syncplay is not configured. Create syncplay.conf next to aemond.ts');
      return;
    }

    const playerBuilder = players[player.toLowerCase()];
    const playerCmd = playerBuilder ? playerBuilder("").cmd : playerBuilder;

    // Build syncplay CLI args
    const syncArgs: string[] = [
      "--host", syncplayConfig.host,
      "--room", syncplayConfig.room,
      "--name", syncplayConfig.user,
      "--player-path", playerCmd,
    ];
    if (syncplayConfig.pass) {
      syncArgs.push("--password", syncplayConfig.pass);
    }
    syncArgs.push(url);

    const syncplayCmd = commands.syncplay;
    const proc = spawn(syncplayCmd, syncArgs, {
      detached: true,
    });
    proc.unref();
    proc.on("error", (err) => {
      console.error(`[${new Date().toISOString()}] Syncplay spawn error:`, err.message);
    });

    const displayUrl = extractFilename(url);
    console.log(`[${new Date().toISOString()}] Syncplay: ${playerCmd} → room "${syncplayConfig.room}" "${displayUrl}"`);

    // SECURITY: Never return args or the decrypted URL
    return console.log('Launced syncplay successfully');
  } catch (e: any) {
    toast.error("Syncplay launch failed", {
      description: e.message || "Ensure syncplay.conf is configured.",
    });
  }
};

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = cdnLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { torrent_id, file_id, account_id, cdnLinkRequired, player, syncplay } = parsed.data;

    // Verify the user owns this account
    if (!verifyUserAccountAccess(session.userId, account_id)) {
      return NextResponse.json(
        { error: "Account not found or access denied" },
        { status: 404 }
      );
    }

    // Get a valid access token (auto-refreshes if expired)
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(account_id);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || "Failed to authenticate with TorBox" },
        { status: 502 }
      );
    }

    // Request CDN download link
    let cdnUrl: string;
    try {
      cdnUrl = await requestCdnLink(torrent_id, file_id, accessToken);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || "Failed to generate CDN link" },
        { status: 502 }
      );
    }

    if (cdnLinkRequired || !player) {
      return NextResponse.json({ success: true, url: cdnUrl });
    }

    if (syncplay) {
      await handleSyncplay(cdnUrl, player, session.userId);
    } else {
      await handleStream(cdnUrl, player);
    }

    return NextResponse.json({ success: true, message: "Player launched successfully" });
  } catch (error) {
    console.error("CDN link error:", error);
    return NextResponse.json(
      { error: "Failed to generate CDN link" },
      { status: 500 }
    );
  }
}
