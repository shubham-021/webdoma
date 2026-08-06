import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAccountsByUserId } from "@/lib/db";
import { getValidAccessToken, checkTorrentCached, checkTorrentsCachedBulk } from "@/lib/torbox";

export const dynamic = "force-dynamic";

/** GET: Check cache for a single torrent hash */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");
    const accountId = searchParams.get("account_id");

    if (!hash) {
      return NextResponse.json({ error: "Missing 'hash' parameter" }, { status: 400 });
    }

    const accounts = getAccountsByUserId(session.userId);
    if (accounts.length === 0) {
      return NextResponse.json({ error: "No TorBox accounts linked" }, { status: 400 });
    }

    let activeAccount = accounts[0];
    if (accountId) {
      const requested = accounts.find(a => a.id === parseInt(accountId, 10));
      if (requested) activeAccount = requested;
    }

    const accessToken = await getValidAccessToken(activeAccount.id);
    const result = await checkTorrentCached(hash, accessToken);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check cache error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check cache" },
      { status: 500 }
    );
  }
}

/** POST: Check cache for multiple torrent hashes (bulk) */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { hashes, account_id } = body;

    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
      return NextResponse.json({ error: "Missing or invalid 'hashes' array" }, { status: 400 });
    }

    const accounts = getAccountsByUserId(session.userId);
    if (accounts.length === 0) {
      return NextResponse.json({ error: "No TorBox accounts linked" }, { status: 400 });
    }

    let activeAccount = accounts[0];
    if (account_id) {
      const requested = accounts.find(a => a.id === parseInt(account_id, 10));
      if (requested) activeAccount = requested;
    }

    const accessToken = await getValidAccessToken(activeAccount.id);
    const result = await checkTorrentsCachedBulk(hashes, accessToken);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bulk check cache error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check cache" },
      { status: 500 }
    );
  }
}
