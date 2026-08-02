import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isRcloneInstalled, getRcloneConfigName } from "@/lib/rclone";
import { WEBDAV_BASE_URL } from "@/lib/constants";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // Check if rclone is installed
    const rcloneInstalled = await isRcloneInstalled();
    if (!rcloneInstalled) {
      return NextResponse.json(
        { success: false, error: "rclone is not installed on the system." },
        { status: 500 }
      );
    }

    const configName = getRcloneConfigName(username);

    // Create the rclone config
    try {
      await execFileAsync("rclone", [
        "config",
        "create",
        configName,
        "webdav",
        `url=${WEBDAV_BASE_URL}`,
        "vendor=other",
        `user=${username}`,
        `pass=${password}`,
      ]);
    } catch (configError) {
      console.error("Failed to create rclone config:", configError);
      return NextResponse.json(
        { success: false, error: "Failed to configure rclone." },
        { status: 500 }
      );
    }

    // Validate credentials using rclone by doing a simple directory list
    try {
      await execFileAsync("rclone", ["lsd", `${configName}:/`]);
    } catch (rcloneError: any) {
      console.error("Rclone validation error:", rcloneError);
      // Clean up invalid config
      await execFileAsync("rclone", ["config", "delete", configName]).catch(() => {});
      
      const stderr = rcloneError.stderr || "";
      if (stderr.includes("401 Unauthorized") || stderr.includes("Invalid credentials")) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      } else if (stderr.includes("429 Too Many Requests")) {
        return NextResponse.json(
          { success: false, error: "TorBox rate limit exceeded. Please wait a few minutes." },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: "Failed to validate credentials via rclone." },
        { status: 500 }
      );
    }

    // Save credentials to session
    const session = await getSession();
    
    // Ensure all previously logged-in accounts are preserved in session.accounts
    if (!session.accounts) {
      session.accounts = [];
    }
    
    // If there was a previously active session, make sure it is in session.accounts
    if (session.username && session.password) {
      const prevExisting = session.accounts.find(a => a.username === session.username);
      if (!prevExisting) {
        session.accounts.push({ username: session.username, password: session.password });
      } else {
        prevExisting.password = session.password;
      }
    }
    
    // Now set the new active session credentials
    session.username = username;
    session.password = password;
    session.playerProtocol = session.playerProtocol || "vlc";
    
    // Make sure the new account is in session.accounts
    const existing = session.accounts.find(a => a.username === username);
    if (existing) {
      existing.password = password;
    } else {
      session.accounts.push({ username, password });
    }

    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
