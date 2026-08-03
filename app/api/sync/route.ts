import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { syncAccount } from "@/lib/sync";
import { getAccountById, verifyUserAccountAccess } from "@/lib/db";

const syncSchema = z.object({
  account_id: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid account_id" }, { status: 400 });
    }

    const { account_id } = parsed.data;

    // Verify account belongs to user
    const account = getAccountById(account_id);
    if (!account || !verifyUserAccountAccess(session.userId, account_id)) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    const result = await syncAccount(account_id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, files_synced: result.filesSynced });
  } catch (error) {
    console.error("Sync API error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}