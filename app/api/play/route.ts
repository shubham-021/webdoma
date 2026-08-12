import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { verifyUserAccountAccess, getWatchedPosition, getUserById } from "@/lib/db";
import { getValidAccessToken, requestCdnLink } from "@/lib/torbox";
import { spawn } from "child_process";
import { rmSync } from "fs";
import {
  resolveCommand,
  buildMpvSocketPath,
  monitorMpv,
  extractFilename,
  players
} from "@/lib/player-daemon";

const playSchema = z.object({
  action: z.enum(["play", "syncplay", "test"]),
  player: z.string().min(1),
  torrent_id: z.number().int().nonnegative().optional(),
  file_id: z.number().int().nonnegative().optional(),
  account_id: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = playSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { action, player, torrent_id, file_id, account_id } = parsed.data;

    if (action === "test") {
      const { cmd, args } = resolveCommand(player, "https://test-url.relay.local/test.mp4", "00:00");
      try {
        const proc = spawn(cmd, args, { detached: true });
        proc.unref();
        return NextResponse.json({ ok: true, status: "launched", player });
      } catch (err) {
        return NextResponse.json({ error: `Failed to launch player: ${(err as Error).message}` }, { status: 500 });
      }
    }

    if (account_id === undefined || torrent_id === undefined || file_id === undefined) {
      return NextResponse.json({ error: "Missing required fields for playback" }, { status: 400 });
    }

    // Verify ownership
    if (!verifyUserAccountAccess(session.userId, account_id)) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    // Get a valid access token
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(account_id);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to authenticate with TorBox" }, { status: 502 });
    }

    // Request CDN download link
    let cdnUrl: string;
    try {
      cdnUrl = await requestCdnLink(torrent_id, file_id, accessToken);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to generate CDN link" }, { status: 502 });
    }

    if (action === "play") {
      // Determine resume start time
      let startTime = "00:00";
      try {
        const row = getWatchedPosition(session.userId, account_id, torrent_id, file_id);
        if (row) {
          const position = row.position_seconds ?? 0;
          const duration = row.duration_seconds ?? null;
          const completed = !!row.completed;
          if (!completed && position > 0 && duration != null && duration > 0 && position < duration - 10) {
            startTime = String(Math.floor(position));
          }
        }
      } catch (e) {
        console.error("Failed to read progress, starting from 00:00", e);
      }

      // Prepare MPV socket if applicable
      const socketPath = player.toLowerCase() === "mpv"
        ? buildMpvSocketPath(torrent_id, file_id)
        : undefined;

      if (socketPath && process.platform !== "win32") {
        try { rmSync(socketPath, { force: true }); } catch { /* ignore */ }
      }

      const { cmd, args } = resolveCommand(player, cdnUrl, startTime, socketPath ? { socketPath } : undefined);

      try {
        const proc = spawn(cmd, args, { detached: true });
        proc.unref();

        proc.on("error", (err) => {
          console.error(`[${new Date().toISOString()}] Spawn error for "${cmd}":`, err.message);
        });

        if (socketPath) {
          monitorMpv(socketPath, {
            userId: session.userId,
            accountId: account_id,
            torrentId: torrent_id,
            fileId: file_id
          });
        }

        const displayUrl = args[0] ? extractFilename(args[0]) : "unknown";
        console.log(`[${new Date().toISOString()}] Launched: ${cmd} "${displayUrl}" (start: ${startTime})`);

        return NextResponse.json({ ok: true, status: "launched", player });
      } catch (err) {
        console.error("Failed to spawn player:", err);
        return NextResponse.json({ error: `Failed to launch player: ${(err as Error).message}` }, { status: 500 });
      }
    } else if (action === "syncplay") {
      const userRecord = getUserById(session.userId);
      if (!userRecord || !userRecord.syncplay_host || !userRecord.syncplay_room || !userRecord.syncplay_user) {
        return NextResponse.json({ error: "Syncplay is not configured. Please configure it in Settings." }, { status: 500 });
      }

      const syncplayConfig = {
        host: userRecord.syncplay_host,
        room: userRecord.syncplay_room,
        user: userRecord.syncplay_user,
        pass: userRecord.syncplay_pass || undefined
      };

      const playerBuilder = players[player.toLowerCase()];
      const playerCmd = playerBuilder ? playerBuilder("", "").cmd : player;

      const syncArgs: string[] = [
        "--host", syncplayConfig.host,
        "--room", syncplayConfig.room,
        "--name", syncplayConfig.user,
        "--player-path", playerCmd,
      ];
      if (syncplayConfig.pass) {
        syncArgs.push("--password", syncplayConfig.pass);
      }
      syncArgs.push(cdnUrl);

      try {
        const syncplayCmd = process.platform === "darwin" ? "/Applications/Syncplay.app/Contents/MacOS/Syncplay" : "syncplay";
        const proc = spawn(syncplayCmd, syncArgs, { detached: true });
        proc.unref();
        proc.on("error", (err) => {
          console.error(`[${new Date().toISOString()}] Syncplay spawn error:`, err.message);
        });

        const displayUrl = extractFilename(cdnUrl);
        console.log(`[${new Date().toISOString()}] Syncplay: ${playerCmd} → room "${syncplayConfig.room}" "${displayUrl}"`);

        return NextResponse.json({ ok: true, status: "launched", player, room: syncplayConfig.room });
      } catch (err) {
        console.error("Failed to spawn syncplay:", err);
        return NextResponse.json({ error: `Failed to launch syncplay: ${(err as Error).message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Play API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
