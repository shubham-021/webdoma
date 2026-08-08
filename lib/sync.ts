/**
 * lib/sync.ts
 * Sync Engine (TorBox API):
 * 1. Get a valid access token (auto-refreshes if needed).
 * 2. Fetch all torrents + files via GET /v1/api/torrents/mylist.
 * 3. Filter files by minimum size threshold.
 * 4. Parse filename using lib/parser (detecting TV Show S01E01 / Movie / Other).
 * 5. Fetch rich metadata (posters, backdrops, episode titles, stills) from TMDB.
 * 6. Save structured records into remote_list_cache, media, and tv_episodes tables.
 */

import {
  updateAccountSyncTime,
  clearRemoteFilesForAccount,
  upsertRemoteFile,
  upsertMedia,
  upsertTvEpisode,
  getUserSetting,
  getUserIdByAccountId
} from "./db";
import { getValidAccessToken, fetchTorrentList } from "./torbox";
import { MIN_FILE_SIZE_BYTES } from "./torbox-config";
import { VIDEO_EXTENSIONS, EXCLUDED_EXTENSIONS } from "./constants";
import { parseMediaFilename, type ParsedMedia } from "./parser";

const EXCLUDED = EXCLUDED_EXTENSIONS; // keep spacing

function getTmdbApiKey(userId?: number | null) {
  let key = process.env.TMDB_API_KEY;
  if (process.env.IS_PACKAGED === 'true' && userId) {
    key = getUserSetting(userId, "TMDB_API_KEY") || key;
  }
  return key;
}

function isVideoFile(filename: string, mimetype?: string): boolean {
  // Prefer mimetype check if available
  if (mimetype && mimetype.startsWith("video/")) return true;
  // Fallback to extension check
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return VIDEO_EXTENSIONS.has(ext);
}

// In-memory set to avoid re-fetching season details multiple times in a single sync
const fetchedSeasonKeys = new Set<string>();

async function searchTmdbMovie(title: string, year?: string, tmdbApiKey?: string | null) {
  if (!tmdbApiKey) return null;

  const fetchMovie = async (searchYear?: string) => {
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
    if (searchYear) url += `&primary_release_year=${searchYear}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results?.[0] || null;
  };

  try {
    let result = await fetchMovie(year);
    if (result) return result;

    // Retry with -1 and +1 year concurrently if exact year failed
    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        const [prev, next] = await Promise.all([
          fetchMovie(String(yearNum - 1)),
          fetchMovie(String(yearNum + 1))
        ]);
        if (prev) return prev;
        if (next) return next;
      }
    }

    // Final fallback without year restriction
    if (year) return await fetchMovie();

    return null;
  } catch (e) {
    console.error("TMDB movie search error:", e);
    return null;
  }
}

async function searchTmdbTv(title: string, year?: string, tmdbApiKey?: string | null) {
  if (!tmdbApiKey) return null;

  const fetchTv = async (searchYear?: string) => {
    let url = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
    if (searchYear) url += `&first_air_date_year=${searchYear}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results?.[0] || null;
  };

  try {
    let result = await fetchTv(year);
    if (result) return result;

    // Retry with -1 and +1 year concurrently if exact year failed
    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        const [prev, next] = await Promise.all([
          fetchTv(String(yearNum - 1)),
          fetchTv(String(yearNum + 1))
        ]);
        if (prev) return prev;
        if (next) return next;
      }
    }

    // Final fallback without year restriction
    if (year) return await fetchTv();

    return null;
  } catch (e) {
    console.error("TMDB TV search error:", e);
    return null;
  }
}

async function fetchAndSaveSeasonEpisodes(showTmdbId: number, seasonNumber: number, tmdbApiKey?: string | null) {
  if (!tmdbApiKey || seasonNumber <= 0) return;
  const key = `${showTmdbId}-S${seasonNumber}`;
  if (fetchedSeasonKeys.has(key)) return;

  try {
    const url = `https://api.themoviedb.org/3/tv/${showTmdbId}/season/${seasonNumber}?api_key=${tmdbApiKey}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();

    if (data && Array.isArray(data.episodes)) {
      for (const ep of data.episodes) {
        const episodeNumber = ep.episode_number;
        const episodeTitle = ep.name || `Episode ${episodeNumber}`;
        const overview = ep.overview || null;
        const stillUrl = ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null;

        upsertTvEpisode(showTmdbId, seasonNumber, episodeNumber, episodeTitle, overview, stillUrl);
      }
      fetchedSeasonKeys.add(key);
    }
  } catch (e) {
    console.error(`Failed to fetch season ${seasonNumber} for show ${showTmdbId}:`, e);
  }
}

export interface SyncResult {
  success: boolean;
  filesSynced: number;
  error?: string;
}

/**
 * Standalone file-processing pipeline.
 * Parses the filename, looks up TMDB metadata, and upserts into
 * remote_list_cache (+ media / tv_episodes when matched).
 *
 * Called by both:
 *  – syncAccount (full resync)
 *  – POST /api/torrent/create (inline insert after adding a torrent)
 *
 * Returns true if the file was inserted, false if skipped.
 */
export async function processAndInsertFile(
  accountId: number,
  torrentId: number,
  torrentHash: string | null,
  file: {
    id: number;
    name: string;
    short_name?: string;
    size: number;
    mimetype?: string;
  },
  options?: { skipSizeFilter?: boolean }
): Promise<boolean> {
  const { skipSizeFilter = false } = options || {};

  // Filter by minimum file size (skip for inline inserts where cache already filtered)
  if (!skipSizeFilter && file.size < MIN_FILE_SIZE_BYTES) return false;

  const remotePath = file.name; // e.g. "Movie Folder/Movie.mkv"
  const filename = file.short_name || remotePath.split("/").pop() || remotePath;

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (EXCLUDED_EXTENSIONS.has(ext)) {
    return false;
  }

  const shortName = file.short_name || null;
  const mimeType = file.mimetype || "application/octet-stream";

  if (!isVideoFile(filename, file.mimetype)) {
    // Non-video file above size threshold — store as 'other'
    upsertRemoteFile(
      accountId, torrentId, file.id,
      remotePath, filename, shortName,
      file.size, mimeType, torrentHash,
      null, null, null, "other"
    );
    return true;
  }

  // Parse filename using parser
  const parsed: ParsedMedia = parseMediaFilename(filename);

  let tmdbId: number | null = null;
  let mediaType: "movie" | "tv" | "other" = "other";
  
  const userId = getUserIdByAccountId(accountId);
  const tmdbApiKey = getTmdbApiKey(userId);

  if (parsed.mediaType === "tv") {
    const tvResult = await searchTmdbTv(parsed.title, parsed.year, tmdbApiKey);
    if (tvResult) {
      const showTmdbId = tvResult.id as number;
      tmdbId = showTmdbId;
      const showTitle = tvResult.name || parsed.title;
      const posterUrl = tvResult.poster_path ? `https://image.tmdb.org/t/p/w500${tvResult.poster_path}` : "";
      const backdropUrl = tvResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvResult.backdrop_path}` : "";
      const firstAir = tvResult.first_air_date ? tvResult.first_air_date.split("-")[0] : parsed.year || "";

      upsertMedia(showTmdbId, showTitle, firstAir, posterUrl, "tv", backdropUrl, tvResult.overview);

      if (parsed.season !== undefined && parsed.season > 0) {
        await fetchAndSaveSeasonEpisodes(showTmdbId, parsed.season, tmdbApiKey);
      }
      mediaType = "tv";
    } else {
      // SxxEyy present but not matched on TMDB — still classify as 'tv'
      mediaType = "tv";
    }
  } else {
    // Try TMDB Movie first
    const movieResult = await searchTmdbMovie(parsed.title, parsed.year, tmdbApiKey);
    if (movieResult) {
      const movieTmdbId = movieResult.id as number;
      tmdbId = movieTmdbId;
      const movieTitle = movieResult.title || parsed.title;
      const posterUrl = movieResult.poster_path ? `https://image.tmdb.org/t/p/w500${movieResult.poster_path}` : "";
      const backdropUrl = movieResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movieResult.backdrop_path}` : "";
      const releaseYear = movieResult.release_date ? movieResult.release_date.split("-")[0] : parsed.year || "";

      upsertMedia(movieTmdbId, movieTitle, releaseYear, posterUrl, "movie", backdropUrl, movieResult.overview);
      mediaType = "movie";
    } else {
      // Try TMDB TV as fallback
      const tvResult = await searchTmdbTv(parsed.title, parsed.year, tmdbApiKey);
      if (tvResult) {
        const showTmdbId = tvResult.id as number;
        tmdbId = showTmdbId;
        const showTitle = tvResult.name || parsed.title;
        const posterUrl = tvResult.poster_path ? `https://image.tmdb.org/t/p/w500${tvResult.poster_path}` : "";
        const backdropUrl = tvResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvResult.backdrop_path}` : "";
        const firstAir = tvResult.first_air_date ? tvResult.first_air_date.split("-")[0] : parsed.year || "";

        upsertMedia(showTmdbId, showTitle, firstAir, posterUrl, "tv", backdropUrl, tvResult.overview);

        if (parsed.season !== undefined && parsed.season > 0) {
          await fetchAndSaveSeasonEpisodes(showTmdbId, parsed.season, tmdbApiKey);
        }
        mediaType = "tv";
      } else {
        mediaType = "other";
      }
    }
  }

  const epStart = parsed.episodes && parsed.episodes.length > 0 ? parsed.episodes[0] : null;
  const epEnd = parsed.episodes && parsed.episodes.length > 1 ? parsed.episodes[parsed.episodes.length - 1] : null;

  upsertRemoteFile(
    accountId,
    torrentId,
    file.id,
    remotePath,
    filename,
    shortName,
    file.size,
    mimeType,
    torrentHash,
    tmdbId,
    parsed.title,
    parsed.year || null,
    mediaType,
    mediaType === "tv" ? parsed.title : null,
    parsed.season ?? null,
    epStart,
    epEnd,
    parsed.year || null
  );

  return true;
}

export async function syncAccount(accountId: number): Promise<SyncResult> {
  try {
    // 1. Get a valid access token (auto-refreshes if expired)
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(accountId);
    } catch (e: any) {
      return { success: false, filesSynced: 0, error: e.message || "Failed to authenticate" };
    }

    // 2. Fetch torrent list from TorBox API
    let torrents;
    try {
      torrents = await fetchTorrentList(accessToken);
    } catch (e: any) {
      if (e.status === 429) {
        return { success: false, filesSynced: 0, error: "TorBox rate limit exceeded" };
      }
      return { success: false, filesSynced: 0, error: e.message || "Failed to fetch torrent list" };
    }

    // 3. Clear all existing remote_list_cache rows for this account (clean slate)
    //    NOTE: media & tv_episodes tables are NOT cleared — they are shared metadata caches.
    clearRemoteFilesForAccount(accountId);

    let filesSynced = 0;

    // 4. Process each torrent and its files through the shared pipeline
    for (const torrent of torrents) {
      const torrentId = torrent.id;
      const torrentHash = torrent.hash || null;

      if (!torrent.files || !Array.isArray(torrent.files)) continue;

      for (const file of torrent.files) {
        const inserted = await processAndInsertFile(
          accountId,
          torrentId,
          torrentHash,
          file
        );
        if (inserted) filesSynced++;
      }
    }

    updateAccountSyncTime(accountId);
    return { success: true, filesSynced };
  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, filesSynced: 0, error: "Sync failed" };
  }
}