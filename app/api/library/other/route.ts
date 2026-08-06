import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOtherFilesForUser } from "@/lib/db";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rawFiles = getOtherFilesForUser(session.userId);

    const items = rawFiles.map((row) => ({
      id: row.id,
      account_id: row.account_id,
      torrent_id: row.torrent_id,
      file_id: row.file_id,
      remote_path: row.remote_path,
      filename: row.filename,
      short_name: row.short_name,
      size: row.size,
      sizeFormatted: formatBytes(row.size || 0),
      mime_type: row.mime_type,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Other Files API error:", error);
    return NextResponse.json({ error: "Failed to fetch uncategorized files" }, { status: 500 });
  }
}
