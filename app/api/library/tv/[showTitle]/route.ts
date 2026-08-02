import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTvShowDetailsForAccount, getAccountsByUserId } from "@/lib/db";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ showTitle: string }> }
) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { showTitle: rawShowTitle } = await params;
    const showTitle = decodeURIComponent(rawShowTitle);

    const { searchParams } = new URL(request.url);
    const accountIdParam = searchParams.get("account_id");

    const accounts = getAccountsByUserId(session.userId);
    if (accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found" }, { status: 404 });
    }

    let activeAccount = accounts[0];
    if (accountIdParam) {
      const requested = accounts.find((a) => a.id === parseInt(accountIdParam, 10));
      if (requested) activeAccount = requested;
    }

    const rawEpisodes = getTvShowDetailsForAccount(activeAccount.id, showTitle);
    if (!rawEpisodes || rawEpisodes.length === 0) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const first = rawEpisodes[0];
    const showInfo = {
      showTitle: first.show_title || first.show_name || showTitle,
      posterUrl: first.show_poster_url,
      backdropUrl: first.show_backdrop_url,
      overview: first.show_overview,
      tmdbId: first.tmdb_id,
    };

    // Group episodes by season
    const seasonsMap = new Map<number, any[]>();
    for (const row of rawEpisodes) {
      const sNum = row.season_number ?? 1;
      if (!seasonsMap.has(sNum)) {
        seasonsMap.set(sNum, []);
      }
      seasonsMap.get(sNum)!.push({
        id: row.id,
        account_id: row.account_id,
        remote_path: row.remote_path,
        filename: row.filename,
        size: row.size,
        sizeFormatted: formatBytes(row.size || 0),
        mime_type: row.mime_type,
        last_modified: row.last_modified,
        season_number: sNum,
        episode_number: row.episode_number,
        episode_end_number: row.episode_end_number,
        episode_title: row.episode_title || `Episode ${row.episode_number ?? 1}`,
        episode_overview: row.episode_overview,
        still_url: row.episode_still_url,
      });
    }

    const seasons = Array.from(seasonsMap.entries()).map(([seasonNumber, episodes]) => ({
      seasonNumber,
      episodes,
    }));

    return NextResponse.json({
      show: showInfo,
      seasons,
    });
  } catch (error) {
    console.error("TV Show Detail API error:", error);
    return NextResponse.json({ error: "Failed to fetch TV show detail" }, { status: 500 });
  }
}
