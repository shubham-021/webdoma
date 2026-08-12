import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { verifyUserAccountAccess } from "@/lib/db";
import { getValidAccessToken, requestCdnLink } from "@/lib/torbox";

const cdnLinkSchema = z.object({
  torrent_id: z.number().int().nonnegative(),
  file_id: z.number().int().nonnegative(),
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
    const parsed = cdnLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { torrent_id, file_id, account_id } = parsed.data;

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

    return NextResponse.json({ success: true, url: cdnUrl });
  } catch (error) {
    console.error("CDN link error:", error);
    return NextResponse.json(
      { error: "Failed to generate CDN link" },
      { status: 500 }
    );
  }
}
