import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { WEBDAV_BASE_URL } from "@/lib/constants";
import { spawn } from "child_process";
import { decrypt } from "@/lib/crypto";
import { getAccountById, verifyUserAccountAccess } from "@/lib/db";

const launchSchema = z.object({
  filePath: z.string().min(1),
  player: z.string().min(1),
  account_id: z.number().int().positive(),
  test: z.boolean().optional(),
});

// Map player IDs to their command-line executables
function getPlayerCommand(player: string) {
  const isDarwin = process.platform === "darwin";

  const players: Record<string, {
    cmd: string;
    args: (url: string) => string[];
    testArgs: string[];
  }> = {
    mpv: {
      cmd: "mpv",
      args: (url) => [url],
      testArgs: [],
    },
    vlc: {
      cmd: isDarwin ? "/Applications/VLC.app/Contents/MacOS/VLC" : "vlc",
      args: (url) => [url],
      testArgs: [],
    },
    iina: {
      cmd: "open",
      args: (url) => ["-a", "IINA", url],
      testArgs: ["-a", "IINA"],
    },
  };
  return players[player] || null;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = launchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { filePath, player, account_id, test } = parsed.data;

    // Get account and decrypt password
    const account = getAccountById(account_id);
    if (!account || !verifyUserAccountAccess(session.userId, account_id)) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    let password: string;
    try {
      password = decrypt(account.webdav_password);
    } catch {
      return NextResponse.json({ error: "Failed to decrypt password" }, { status: 500 });
    }

    const playerConfig = getPlayerCommand(player);
    if (!playerConfig) {
      return NextResponse.json({ error: `Unknown player: ${player}` }, { status: 400 });
    }

    let args: string[];

    if (test) {
      // Test mode: launch player in idle mode without streaming
      args = playerConfig.testArgs;
    } else {
      // Build direct WebDAV URL with embedded credentials
      // e.g. https://user:pass@webdav.torbox.app/path/to/file.mkv
      // This lets mpv/VLC fetch directly from TorBox — no proxy hop needed
      const webdavURL = new URL(WEBDAV_BASE_URL);
      webdavURL.username = encodeURIComponent(account.webdav_username);
      webdavURL.password = encodeURIComponent(password);
      webdavURL.pathname = filePath;

      const directURL = webdavURL.toString();
      args = playerConfig.args(directURL);
    }

    // Spawn the player as a detached process
    const child = spawn(playerConfig.cmd, args, {
      detached: true,
      stdio: "ignore",
    });

    // Unref so the Node process doesn't wait for the player to exit
    child.unref();

    return NextResponse.json({
      success: true,
      message: `Launched ${player}${test ? " (test)" : ""}`,
      pid: child.pid,
    });
  } catch (error) {
    console.error("Player launch error:", error);
    return NextResponse.json({ error: "Failed to launch player" }, { status: 500 });
  }
}