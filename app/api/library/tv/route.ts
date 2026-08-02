import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTvShowsForAccount, getAccountsByUserId } from "@/lib/db";

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
      return NextResponse.json({ shows: [] });
    }

    let activeAccount = accounts[0];
    if (accountIdParam) {
      const requested = accounts.find((a) => a.id === parseInt(accountIdParam, 10));
      if (requested) activeAccount = requested;
    }

    const rawShows = getTvShowsForAccount(activeAccount.id);

    const shows = rawShows.map((row) => ({
      show_title: row.show_title,
      tmdb_id: row.tmdb_id,
      poster_url: row.poster_url,
      backdrop_url: row.backdrop_url,
      overview: row.overview,
      season_count: row.season_count,
      episode_count: row.episode_count,
      start_year: row.start_year,
    }));

    return NextResponse.json({ shows });
  } catch (error) {
    console.error("TV Shows API error:", error);
    return NextResponse.json({ error: "Failed to fetch TV shows" }, { status: 500 });
  }
}
