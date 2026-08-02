/**
 * lib/parser.ts
 * Ported from torbox-organizer for DoMa Web.
 * Parses media filenames into Movie, TV, or Other metadata without filesystem or API dependencies.
 */

export const SEASON_EPISODE_RE = /S(\d{1,2})E(\d{1,3})((?:[-._]?E\d{1,3})*)/i;
export const EXTRA_EPISODE_RE = /E(\d{1,3})/gi;
export const X_FORMAT_RE = /(?<![A-Za-z0-9])(\d{1,2})x(\d{2,3})(?![A-Za-z0-9])/;
export const SEASON_ONLY_RE = /(?<![A-Za-z0-9])S(\d{1,2})(?!\d)(?!E)/i;
export const YEAR_RE = /\b(19\d{2}|20\d{2})\b/g;

export interface ParsedMedia {
  mediaType: "movie" | "tv" | "other";
  title: string;
  year?: string;
  season?: number;
  episodes?: number[];
  extension: string;
  originalFilename: string;
}

export function cleanTitle(raw: string): string {
  // Strip common release tags if present before cleaning
  let cleaned = raw
    .replace(/(1080p|720p|2160p|4k|bluray|web-dl|webrip|hevc|x264|x265|remux|h264|h265|hdr|ddp5\.1|aac).*/i, "")
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-]+|[\s\-]+$/g, "")
    .trim();

  return cleaned;
}

interface Detection {
  season: number;
  episodes: number[];
  matchIndex: number;
}

function detectSeasonEpisode(base: string): Detection | null {
  // S01E01, S01E01E02, S01E01-E02
  const seMatch = SEASON_EPISODE_RE.exec(base);
  if (seMatch) {
    const season = parseInt(seMatch[1], 10);
    const episodes = [parseInt(seMatch[2], 10)];
    const tail = seMatch[3] ?? "";

    EXTRA_EPISODE_RE.lastIndex = 0;
    let extra: RegExpExecArray | null;
    while ((extra = EXTRA_EPISODE_RE.exec(tail)) !== null) {
      episodes.push(parseInt(extra[1], 10));
    }

    return { season, episodes, matchIndex: seMatch.index };
  }

  // 1x01 / 01x01
  const xMatch = X_FORMAT_RE.exec(base);
  if (xMatch) {
    return {
      season: parseInt(xMatch[1], 10),
      episodes: [parseInt(xMatch[2], 10)],
      matchIndex: xMatch.index,
    };
  }

  // Season-only pack, e.g. "Show.S02.Complete"
  const sMatch = SEASON_ONLY_RE.exec(base);
  if (sMatch) {
    return {
      season: parseInt(sMatch[1], 10),
      episodes: [],
      matchIndex: sMatch.index,
    };
  }

  return null;
}

export function parseMediaFilename(filename: string): ParsedMedia {
  const lastDot = filename.lastIndexOf(".");
  const extension = lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : "";
  const base = lastDot !== -1 ? filename.slice(0, lastDot) : filename;

  const detection = detectSeasonEpisode(base);

  if (detection) {
    const rawTitle = base.slice(0, detection.matchIndex);
    const title = cleanTitle(rawTitle) || "Unknown Show";

    return {
      mediaType: "tv",
      title,
      season: detection.season,
      episodes: detection.episodes,
      extension,
      originalFilename: filename,
    };
  }

  let yearMatches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  YEAR_RE.lastIndex = 0;
  while ((match = YEAR_RE.exec(base)) !== null) {
    yearMatches.push(match);
  }

  // Filter out year matches at the very beginning of the string (index 0) 
  // to avoid truncating titles that start with a year (e.g. 2001 A Space Odyssey)
  yearMatches = yearMatches.filter((m) => m.index > 0);

  // Take the LAST year match found before extension/quality tags
  const lastYearMatch = yearMatches.length > 0 ? yearMatches[yearMatches.length - 1] : null;

  const titleSource = lastYearMatch ? base.slice(0, lastYearMatch.index) : base;
  const title = cleanTitle(titleSource) || "Unknown Media";

  return {
    mediaType: lastYearMatch ? "movie" : "other",
    title,
    year: lastYearMatch ? lastYearMatch[1] : undefined,
    extension,
    originalFilename: filename,
  };
}
