import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getFilesForAccount, getAccountsByUserId } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import type { FileItem, FilesResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountIdParam = searchParams.get("account_id");

    // Get user's accounts
    const accounts = getAccountsByUserId(session.userId);
    if (accounts.length === 0) {
      return NextResponse.json({ items: [], currentPath: "/", breadcrumbs: [{ name: "Home", path: "/" }] });
    }

    // Determine active account
    let activeAccount = accounts[0];
    if (accountIdParam) {
      const requested = accounts.find(a => a.id === parseInt(accountIdParam, 10));
      if (requested) activeAccount = requested;
    }

    // Fetch files from DB (fast SQL JOIN)
    const dbFiles = getFilesForAccount(activeAccount.id);

    // Transform to FileItem format
    const items: FileItem[] = dbFiles.map((row) => {
      const filename = row.filename;
      const ext = filename.split(".").pop()?.toLowerCase() || "";
      const size = row.size || 0;

      return {
        id: row.id,
        account_id: row.account_id,
        remote_path: row.remote_path,
        filename,
        size,
        sizeFormatted: formatBytes(size),
        mime_type: row.mime_type || "video/mp4",
        last_modified: row.last_modified,
        tmdb_id: row.tmdb_id,
        raw_title: row.raw_title,
        raw_year: row.raw_year,
        synced_at: row.synced_at,
        media_title: row.media_title,
        media_year: row.media_year,
        media_poster_url: row.media_poster_url,
        media_type: row.media_type,
      };
    });

    // Sort by display title (media title > raw title > filename)
    items.sort((a, b) => {
      const titleA = a.media_title || a.raw_title || a.filename;
      const titleB = b.media_title || b.raw_title || b.filename;
      return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
    });

    const response: FilesResponse = {
      items,
      currentPath: "/",
      breadcrumbs: [{ name: "Home", path: "/" }],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Files listing error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}