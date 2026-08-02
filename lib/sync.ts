/**
 * lib/sync.ts
 * Sync Engine:
 * 1. Decrypt WebDAV credentials and configure rclone.
 * 2. Run rclone lsjson to retrieve flat list of remote files.
 * 3. Parse filename using lib/parser (detecting TV Show S01E01 / Movie / Other).
 * 4. Fetch rich metadata (posters, backdrops, episode titles, episode stills) from TMDB.
 * 5. Save structured records into remote_list_cache, media, and tv_episodes tables.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import {
  getAccountById,
  updateAccountSyncTime,
  clearRemoteFilesForAccount,
  upsertRemoteFile,
  upsertMedia,
  upsertTvEpisode,
} from "./db";
import { decrypt } from "./crypto";
import { isRcloneInstalled } from "./rclone";
import { WEBDAV_BASE_URL } from "./constants";
import { parseMediaFilename, ParsedMedia } from "./parser";

const execFileAsync = promisify(execFile);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const VIDEO_EXTENSIONS = new Set([
  "mp4", "mkv", "mov", "avi", "wmv", "flv", "webm", "m4v",
  "mpg", "mpeg", "ts", "vob", "3gp", "ogv",
]);

function isVideoFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return VIDEO_EXTENSIONS.has(ext);
}

// In-memory set to avoid re-fetching season details multiple times in a single sync
const fetchedSeasonKeys = new Set<string>();

async function searchTmdbMovie(title: string, year?: string) {
  if (!TMDB_API_KEY) return null;

  const fetchMovie = async (searchYear?: string) => {
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
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

async function searchTmdbTv(title: string, year?: string) {
  if (!TMDB_API_KEY) return null;

  const fetchTv = async (searchYear?: string) => {
    let url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
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

async function fetchAndSaveSeasonEpisodes(showTmdbId: number, seasonNumber: number) {
  if (!TMDB_API_KEY || seasonNumber <= 0) return;
  const key = `${showTmdbId}-S${seasonNumber}`;
  if (fetchedSeasonKeys.has(key)) return;

  try {
    const url = `https://api.themoviedb.org/3/tv/${showTmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`;
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

export async function syncAccount(accountId: number): Promise<SyncResult> {
  try {
    // 1. Get account and decrypt password
    const account = getAccountById(accountId);
    if (!account) {
      return { success: false, filesSynced: 0, error: "Account not found" };
    }

    const rcloneInstalled = await isRcloneInstalled();
    if (!rcloneInstalled) {
      return { success: false, filesSynced: 0, error: "rclone is not installed" };
    }

    let webdavPassword: string;
    try {
      webdavPassword = decrypt(account.webdav_password);
    } catch (e) {
      return { success: false, filesSynced: 0, error: "Failed to decrypt password" };
    }

    // 2. Create/update rclone config
    const configName = account.rclone_config_name;
    try {
      await execFileAsync("rclone", [
        "config",
        "create",
        configName,
        "webdav",
        `url=${WEBDAV_BASE_URL}`,
        "vendor=other",
        `user=${account.webdav_username}`,
        `pass=${webdavPassword}`,
      ]);
    } catch (e) {
      console.error("Failed to create rclone config:", e);
      return { success: false, filesSynced: 0, error: "Failed to configure rclone" };
    }

    // 3. Run rclone lsjson to get all video files
    let stdout: string;
    try {
      const result = await execFileAsync("rclone", [
        "lsjson",
        `${configName}:/`,
        "-R",
        "--files-only",
        "--min-size", "100M",
        "--include", "*.{mp4,mkv,mov,avi,wmv,flv,webm,m4v,mpg,mpeg,ts,vob,3gp,ogv}"
      ]);
      stdout = result.stdout;
    } catch (e: any) {
      console.error("rclone lsjson error:", e);
      if (e.stderr && e.stderr.includes("429 Too Many Requests")) {
        return { success: false, filesSynced: 0, error: "TorBox rate limit exceeded" };
      }
      return { success: false, filesSynced: 0, error: "Failed to list files via rclone" };
    }

    let rawItems: any[];
    try {
      rawItems = JSON.parse(stdout);
    } catch (e) {
      return { success: false, filesSynced: 0, error: "Failed to parse rclone output" };
    }

    clearRemoteFilesForAccount(accountId);

    let filesSynced = 0;

    for (const item of rawItems) {
      const filename = item.Name;
      if (!isVideoFile(filename)) {
        // Save non-video file under 'other'
        const size = item.Size || 0;
        const itemPath = item.Path.startsWith("/") ? item.Path : `/${item.Path}`;
        upsertRemoteFile(accountId, itemPath, filename, size, item.MimeType || "application/octet-stream", item.ModTime || new Date().toISOString(), null, null, null, "other");
        filesSynced++;
        continue;
      }

      const size = item.Size || 0;
      const itemPath = item.Path.startsWith("/") ? item.Path : `/${item.Path}`;
      const mimeType = item.MimeType || "video/mp4";
      const lastModified = item.ModTime || new Date().toISOString();

      // Parse filename using parser
      const parsed: ParsedMedia = parseMediaFilename(filename);

      let tmdbId: number | null = null;
      let mediaType: "movie" | "tv" | "other" = "other";

      if (parsed.mediaType === "tv") {
        const tvResult = await searchTmdbTv(parsed.title, parsed.year);
        if (tvResult) {
          const showTmdbId = tvResult.id as number;
          tmdbId = showTmdbId;
          const showTitle = tvResult.name || parsed.title;
          const posterUrl = tvResult.poster_path ? `https://image.tmdb.org/t/p/w500${tvResult.poster_path}` : "";
          const backdropUrl = tvResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvResult.backdrop_path}` : "";
          const firstAir = tvResult.first_air_date ? tvResult.first_air_date.split("-")[0] : parsed.year || "";

          upsertMedia(showTmdbId, showTitle, firstAir, posterUrl, "tv", backdropUrl, tvResult.overview);

          if (parsed.season !== undefined && parsed.season > 0) {
            await fetchAndSaveSeasonEpisodes(showTmdbId, parsed.season);
          }
          mediaType = "tv";
        } else {
          // Explicit SxxEyy format present -> classified as 'tv' even if not matched on TMDB
          mediaType = "tv";
        }
      } else {
        // Try searching TMDB Movie first
        const movieResult = await searchTmdbMovie(parsed.title, parsed.year);
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
          // Try searching TMDB TV as fallback
          const tvResult = await searchTmdbTv(parsed.title, parsed.year);
          if (tvResult) {
            const showTmdbId = tvResult.id as number;
            tmdbId = showTmdbId;
            const showTitle = tvResult.name || parsed.title;
            const posterUrl = tvResult.poster_path ? `https://image.tmdb.org/t/p/w500${tvResult.poster_path}` : "";
            const backdropUrl = tvResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvResult.backdrop_path}` : "";
            const firstAir = tvResult.first_air_date ? tvResult.first_air_date.split("-")[0] : parsed.year || "";

            upsertMedia(showTmdbId, showTitle, firstAir, posterUrl, "tv", backdropUrl, tvResult.overview);

            if (parsed.season !== undefined && parsed.season > 0) {
              await fetchAndSaveSeasonEpisodes(showTmdbId, parsed.season);
            }
            mediaType = "tv";
          } else {
            // UNRECOGNIZED FILE: Not found on TMDB and lacks SxxEyy format -> goes to 'other'
            mediaType = "other";
          }
        }
      }

      const epStart = parsed.episodes && parsed.episodes.length > 0 ? parsed.episodes[0] : null;
      const epEnd = parsed.episodes && parsed.episodes.length > 1 ? parsed.episodes[parsed.episodes.length - 1] : null;

      upsertRemoteFile(
        accountId,
        itemPath,
        filename,
        size,
        mimeType,
        lastModified,
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

      filesSynced++;
    }

    updateAccountSyncTime(accountId);
    return { success: true, filesSynced };
  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, filesSynced: 0, error: "Sync failed" };
  }
}