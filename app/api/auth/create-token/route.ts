import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createToken } from "@/lib/tokens";
import { decrypt } from "@/lib/crypto";
import { getAccountById } from "@/lib/db";

const createTokenSchema = z.object({
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
    const parsed = createTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { filePath, account_id } = parsed.data;

    // Get account and decrypt password
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

    const { token, expiresAt } = createToken(
      filePath,
      account.webdav_username,
      password
    );

    return NextResponse.json({
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Create token error:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}