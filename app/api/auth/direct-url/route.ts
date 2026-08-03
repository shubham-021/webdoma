import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { decrypt, encryptAemondPayload } from "@/lib/crypto";
import { getAccountById } from "@/lib/db";

const directUrlSchema = z.object({
  filePath: z.string().min(1, "File path is required"),
  account_id: z.number().int().positive(),
});

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
    const parsed = directUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { filePath, account_id } = parsed.data;

    const account = getAccountById(account_id);
    if (!account || account.user_id !== session.userId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    let password: string;
    try {
      password = decrypt(account.webdav_password);
    } catch {
      return NextResponse.json({ error: "Failed to decrypt password" }, { status: 500 });
    }

    // Construct the direct TorBox WebDAV URL
    // Encode the filePath, but leave the slashes intact. encodeURI handles this perfectly.
    const encodedPath = encodeURI(filePath.startsWith("/") ? filePath : `/${filePath}`);
    const host = "webdav.torbox.app";
    
    // Note: TorBox WebDAV URL format: https://username:password@webdav.torbox.app/path
    const encodedUsername = encodeURIComponent(account.webdav_username);
    const encodedPassword = encodeURIComponent(password);

    const directUrl = `https://${encodedUsername}:${encodedPassword}@${host}${encodedPath}`;
    
    // Encrypt the URL strictly for the local aemond daemon so credentials bypass the browser network tab
    const cipher = encryptAemondPayload(directUrl);

    return NextResponse.json({ cipher });
  } catch (error) {
    console.error("Direct URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate direct URL" },
      { status: 500 }
    );
  }
}
