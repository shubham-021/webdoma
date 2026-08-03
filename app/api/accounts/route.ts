import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  getAccountByWebdavUsername,
  createAccount,
  getAccountsByUserId,
  getAccountById,
  getDb,
} from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { isRcloneInstalled } from "@/lib/rclone";
import { WEBDAV_BASE_URL } from "@/lib/constants";
import { syncAccount } from "@/lib/sync";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const db = getDb();

const addAccountSchema = z.object({
  webdav_username: z.string().min(1, "WebDAV username (TorBox email or 'torbox') is required"),
  webdav_password: z.string().min(1, "WebDAV password (API key) is required")
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accounts = getAccountsByUserId(session.userId);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Get accounts error:", error);
    return NextResponse.json({ error: "Failed to get accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { webdav_username, webdav_password } = parsed.data;

    // Check if rclone is installed
    const rcloneInstalled = await isRcloneInstalled();
    if (!rcloneInstalled) {
      return NextResponse.json(
        { success: false, error: "rclone is not installed on the system." },
        { status: 500 }
      );
    }

    // Check if account already exists for this user
    const existing = getAccountByWebdavUsername(session.userId, webdav_username);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "This TorBox account is already added" },
        { status: 409 }
      );
    }

    const encryptedPassword = encrypt(webdav_password);
    const accountId = createAccount(session.userId, webdav_username, encryptedPassword);

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Failed to save account" },
        { status: 500 }
      );
    }

    // Get the created account to retrieve the generated rclone config name
    const account = getAccountById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve created account" },
        { status: 500 }
      );
    }

    const configName = account.rclone_config_name;

    // Validate credentials with rclone using the generated config name
    try {
      await execFileAsync("rclone", [
        "config",
        "create",
        configName,
        "webdav",
        `url=${WEBDAV_BASE_URL}`,
        "vendor=other",
        `user=${webdav_username}`,
        `pass=${webdav_password}`,
      ]);
    } catch (configError) {
      console.error("Failed to create rclone config:", configError);
      // Clean up DB record on failure
      db.query("DELETE FROM accounts WHERE id = ?").run(accountId);
      return NextResponse.json(
        { success: false, error: "Failed to configure rclone." },
        { status: 500 }
      );
    }

    // Validate credentials using rclone
    try {
      await execFileAsync("rclone", ["lsd", `${configName}:/`]);
    } catch (rcloneError: any) {
      console.error("Rclone validation error:", rcloneError);
      // Clean up invalid config
      await execFileAsync("rclone", ["config", "delete", configName]).catch(() => {});
      // Clean up DB record
      db.query("DELETE FROM accounts WHERE id = ?").run(accountId);

      const stderr = rcloneError.stderr || "";
      if (stderr.includes("401 Unauthorized") || stderr.includes("Invalid credentials")) {
        return NextResponse.json(
          { success: false, error: "Invalid TorBox credentials" },
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

    // Automatically perform initial sync for the newly added account
    await syncAccount(account.id);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        webdav_username: account.webdav_username,
        rclone_config_name: account.rclone_config_name,
        is_active: true,
        last_synced_at: account.last_synced_at,
      },
    });
  } catch (error) {
    console.error("Add account error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add account. Please try again." },
      { status: 500 }
    );
  }
}