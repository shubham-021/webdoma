import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createToken } from "@/lib/tokens";
import { spawn } from "child_process";

const launchSchema = z.object({
  filePath: z.string().min(1),
  player: z.string().min(1),
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
      args: (url) => ["--force-window", "--no-terminal", url],
      testArgs: ["--idle", "--force-window", "--no-terminal", "--title=DoMa Test - Close this window"],
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
    if (!session.username || !session.password) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = launchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { filePath, player, test } = parsed.data;

    const playerConfig = getPlayerCommand(player);
    if (!playerConfig) {
      return NextResponse.json({ error: `Unknown player: ${player}` }, { status: 400 });
    }

    let args: string[];

    if (test) {
      // Test mode: launch player in idle mode without streaming
      args = playerConfig.testArgs;
    } else {
      // Normal mode: create a token and stream
      const { token } = createToken(filePath, session.username, session.password);
      const streamURL = `${getBaseURL(request)}/api/stream${filePath}?token=${token}`;
      args = playerConfig.args(streamURL);
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

function getBaseURL(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
