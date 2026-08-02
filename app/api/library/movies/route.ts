import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMoviesForAccount, getAccountsByUserId } from "@/lib/db";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountIdParam = searchParams.get("account_id");

    const accounts = getAccountsByUserId(session.userId);
    if (accounts.length === 0) {
      return NextResponse.json({ items: [] });
    }

    let activeAccount = accounts[0];
    if (accountIdParam) {
      const requested = accounts.find((a) => a.id === parseInt(accountIdParam, 10));
      if (requested) activeAccount = requested;
    }

    const rawMovies = getMoviesForAccount(activeAccount.id);

    const items = rawMovies.map((row) => ({
      id: row.id,
      account_id: row.account_id,
      remote_path: row.remote_path,
      filename: row.filename,
      size: row.size,
      sizeFormatted: formatBytes(row.size || 0),
      mime_type: row.mime_type,
      last_modified: row.last_modified,
      tmdb_id: row.tmdb_id,
      title: row.media_title || row.raw_title || row.filename,
      year: row.media_year || row.parsed_year || row.raw_year,
      poster_url: row.media_poster_url,
      backdrop_url: row.media_backdrop_url,
      overview: row.media_overview,
      synced_at: row.synced_at,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Movies API error:", error);
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}
