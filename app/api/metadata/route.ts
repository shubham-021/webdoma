import { NextResponse } from "next/server";
import { getMetadata, setMetadata, getUserSetting } from "@/lib/db";
import { getSession } from "@/lib/session";

function parseFilename(filename: string) {
  let title = filename;
  let year = "";

  // Remove extension
  title = title.replace(/\.[^/.]+$/, "");

  // Match Title and Year (e.g. Joker.2019.2160p...)
  // This regex looks for something ending with a year (19xx or 20xx)
  const match = title.match(/^(.*?)[. _-](\b(?:19|20)\d{2}\b)/);
  
  if (match) {
    title = match[1];
    year = match[2];
  } else {
    // If no year found, strip common release tags anyway
    title = title.replace(/(1080p|720p|2160p|4k|bluray|web-dl|hevc|x264|x265|remux).*/i, "");
  }

  // Replace dots and underscores with spaces
  title = title.replace(/[\._]/g, " ").trim();

  return { title, year };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  // 1. Check SQLite Cache
  const cached = getMetadata(filename);
  if (cached && cached.poster_url) {
    return NextResponse.json({
      title: cached.title,
      year: cached.year,
      posterUrl: cached.poster_url,
      source: "cache"
    });
  }

  // 2. Parse Filename
  const { title, year } = parseFilename(filename);

  // 3. Fetch User-Specific TMDB_API_KEY in prod, fallback to global
  const session = await getSession();
  let TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (process.env.IS_PACKAGED === 'true' && session.userId) {
    TMDB_API_KEY = getUserSetting(session.userId, "TMDB_API_KEY") || TMDB_API_KEY;
  }

  // 4. Check TMDB API
  if (!TMDB_API_KEY) {
    return NextResponse.json({ 
      title, 
      year, 
      posterUrl: null, 
      error: "No TMDB API key" 
    });
  }

  let posterUrl = null;
  let fetchedTitle = title;
  let fetchedYear = year;

  try {
    // First try movie search
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    if (year) url += `&primary_release_year=${year}`;

    let res = await fetch(url);
    let data = await res.json();

    let result = data.results?.[0];

    // If no movie found, try TV show search
    if (!result) {
      url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
      if (year) url += `&first_air_date_year=${year}`;
      
      res = await fetch(url);
      data = await res.json();
      result = data.results?.[0];
    }

    if (result && result.poster_path) {
      posterUrl = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
      fetchedTitle = result.title || result.name || title;
      
      // Extract year from release date
      const releaseDate = result.release_date || result.first_air_date;
      if (releaseDate) {
        fetchedYear = releaseDate.split('-')[0];
      }
    }

    // 4. Save to Cache
    setMetadata(filename, fetchedTitle, fetchedYear, posterUrl || "");

    return NextResponse.json({
      title: fetchedTitle,
      year: fetchedYear,
      posterUrl,
      source: "tmdb"
    });

  } catch (error) {
    console.error("TMDB API Error:", error);
    return NextResponse.json({ title, year, posterUrl: null, error: "API failed" }, { status: 500 });
  }
}
