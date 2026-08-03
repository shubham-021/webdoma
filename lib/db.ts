// @ts-ignore
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";

// Ensure data directory exists before initializing database
if (!existsSync("./data")) {
  mkdirSync("./data", { recursive: true });
}

// Initialize database
let db: any;

const globalForDb = globalThis as unknown as { __domaDb: any };

try {
  if (!globalForDb.__domaDb) {
    globalForDb.__domaDb = new Database("./data/metadata.sqlite", { create: true });

    // Enable WAL mode and set busy timeout for better concurrent read/write performance
    globalForDb.__domaDb.query("PRAGMA journal_mode = WAL").run();
    globalForDb.__domaDb.query("PRAGMA busy_timeout = 5000").run();
    globalForDb.__domaDb.query("PRAGMA foreign_keys = ON").run();

    // ── users ──────────────────────────────────────────────────────────────────
    globalForDb.__domaDb
      .query(
        `
      CREATE TABLE IF NOT EXISTS users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        username  TEXT    NOT NULL UNIQUE,
        password  TEXT    NOT NULL,          -- bcrypt hash
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
      )
      .run();

    // ── accounts (TorBox globally unique accounts) ──────────────────────────────
    globalForDb.__domaDb
      .query(
        `
      CREATE TABLE IF NOT EXISTS accounts (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        webdav_username  TEXT    NOT NULL UNIQUE, -- TorBox email or "torbox"
        webdav_password  TEXT    NOT NULL,   -- encrypted ciphertext
        rclone_config_name TEXT NOT NULL,
        last_synced_at   DATETIME,
        created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
      )
      .run();

    // ── user_accounts (Junction Table) ──────────────────────────────────────────
    globalForDb.__domaDb
      .query(
        `
      CREATE TABLE IF NOT EXISTS user_accounts (
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id       INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        is_active        INTEGER NOT NULL DEFAULT 1,
        created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, account_id)
      )
    `
      )
      .run();

    // ── media ──────────────────────────────────────────────────────────────────
    globalForDb.__domaDb
      .query(
        `
      CREATE TABLE IF NOT EXISTS media (
        tmdb_id      INTEGER PRIMARY KEY,
        title        TEXT    NOT NULL,
        year         TEXT,
        poster_url   TEXT,
        backdrop_url TEXT,
        overview     TEXT,
        media_type   TEXT    NOT NULL DEFAULT 'movie', -- 'movie' | 'tv'
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
      )
      .run();

    // ── remote_list_cache ──────────────────────────────────────────────────────
    globalForDb.__domaDb
      .query(
        `
      CREATE TABLE IF NOT EXISTS remote_list_cache (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id         INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        remote_path        TEXT    NOT NULL,
        filename           TEXT    NOT NULL,
        size               INTEGER NOT NULL DEFAULT 0,
        mime_type          TEXT,
        last_modified      DATETIME,
        tmdb_id            INTEGER REFERENCES media(tmdb_id) ON DELETE SET NULL,
        raw_title          TEXT,
        raw_year           TEXT,
        media_type         TEXT DEFAULT 'other', -- 'movie' | 'tv' | 'other'
        show_title         TEXT,
        season_number      INTEGER,
        episode_number     INTEGER,
        episode_end_number INTEGER,
        parsed_year        TEXT,
        synced_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, remote_path)
      )
    `
      )
      .run();

    // ── tv_episodes ────────────────────────────────────────────────────────────
    globalForDb.__domaDb
      .query(
        `
      CREATE TABLE IF NOT EXISTS tv_episodes (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        show_tmdb_id   INTEGER NOT NULL REFERENCES media(tmdb_id) ON DELETE CASCADE,
        season_number  INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        episode_title  TEXT,
        overview       TEXT,
        still_url      TEXT,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(show_tmdb_id, season_number, episode_number)
      )
    `
      )
      .run();

    // ── metadata_cache (legacy) ────────────────────────────────────────────────
    globalForDb.__domaDb
      .query(
        `
      CREATE TABLE IF NOT EXISTS metadata_cache (
        filename TEXT PRIMARY KEY,
        title TEXT,
        year TEXT,
        poster_url TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
      )
      .run();

    // Safe column additions for existing database tables
    try { globalForDb.__domaDb.query("ALTER TABLE media ADD COLUMN backdrop_url TEXT").run(); } catch (_) {}
    try { globalForDb.__domaDb.query("ALTER TABLE media ADD COLUMN overview TEXT").run(); } catch (_) {}
    try { globalForDb.__domaDb.query("ALTER TABLE remote_list_cache ADD COLUMN media_type TEXT DEFAULT 'other'").run(); } catch (_) {}
    try { globalForDb.__domaDb.query("ALTER TABLE remote_list_cache ADD COLUMN show_title TEXT").run(); } catch (_) {}
    try { globalForDb.__domaDb.query("ALTER TABLE remote_list_cache ADD COLUMN season_number INTEGER").run(); } catch (_) {}
    try { globalForDb.__domaDb.query("ALTER TABLE remote_list_cache ADD COLUMN episode_number INTEGER").run(); } catch (_) {}
    try { globalForDb.__domaDb.query("ALTER TABLE remote_list_cache ADD COLUMN episode_end_number INTEGER").run(); } catch (_) {}
    try { globalForDb.__domaDb.query("ALTER TABLE remote_list_cache ADD COLUMN parsed_year TEXT").run(); } catch (_) {}
  }

  db = globalForDb.__domaDb;
} catch (error) {
  console.error("Failed to initialize bun:sqlite:", error);
}

export function getDb() {
  return db;
}

// ── users ──────────────────────────────────────────────────────────────────────

export function getUserByUsername(username: string) {
  if (!db) return null;
  try {
    return db.query("SELECT * FROM users WHERE username = ?").get(username) as any;
  } catch (e) {
    console.error("getUserByUsername error:", e);
    return null;
  }
}

export function getUserById(id: number) {
  if (!db) return null;
  try {
    return db.query("SELECT * FROM users WHERE id = ?").get(id) as any;
  } catch (e) {
    console.error("getUserById error:", e);
    return null;
  }
}

export function createUser(username: string, hashedPassword: string): number | null {
  if (!db) return null;
  try {
    const result = db
      .query("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(username, hashedPassword);
    return result.lastInsertRowid as number;
  } catch (e) {
    console.error("createUser error:", e);
    return null;
  }
}

// ── accounts ──────────────────────────────────────────────────────────────────

export function getAccountsByUserId(userId: number) {
  if (!db) return [];
  try {
    return db
      .query(`
        SELECT a.id, a.webdav_username, a.rclone_config_name, a.last_synced_at, ua.is_active 
        FROM accounts a
        JOIN user_accounts ua ON ua.account_id = a.id
        WHERE ua.user_id = ?
        ORDER BY a.created_at ASC
      `)
      .all(userId) as any[];
  } catch (e) {
    console.error("getAccountsByUserId error:", e);
    return [];
  }
}

export function getAccountById(accountId: number) {
  if (!db) return null;
  try {
    return db.query("SELECT * FROM accounts WHERE id = ?").get(accountId) as any;
  } catch (e) {
    console.error("getAccountById error:", e);
    return null;
  }
}

export function verifyUserAccountAccess(userId: number, accountId: number): boolean {
  if (!db) return false;
  try {
    const link = db.query("SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?").get(userId, accountId);
    return !!link;
  } catch (e) {
    console.error("verifyUserAccountAccess error:", e);
    return false;
  }
}

export function getAccountByWebdavUsername(userId: number, webdavUsername: string) {
  if (!db) return null;
  try {
    return db
      .query(`
        SELECT a.*, ua.is_active 
        FROM accounts a
        JOIN user_accounts ua ON ua.account_id = a.id
        WHERE ua.user_id = ? AND a.webdav_username = ?
      `)
      .get(userId, webdavUsername) as any;
  } catch (e) {
    console.error("getAccountByWebdavUsername error:", e);
    return null;
  }
}

export function createAccount(
  userId: number,
  webdavUsername: string,
  encryptedPassword: string
): number | null {
  if (!db) return null;
  try {
    const user = getUserById(userId);
    if (!user) return null;

    let account = db.query("SELECT * FROM accounts WHERE webdav_username = ? LIMIT 1").get(webdavUsername) as any;

    if (!account) {
      // Create new global TorBox account
      const existingCount = db
        .query("SELECT COUNT(*) as count FROM accounts")
        .get() as { count: number };
      const nextIndex = (existingCount?.count || 0) + 1;
      const rcloneConfigName = `webdoma_torbox_${nextIndex}`;

      const result = db
        .query(
          `INSERT INTO accounts (webdav_username, webdav_password, rclone_config_name)
           VALUES (?, ?, ?)`
        )
        .run(webdavUsername, encryptedPassword, rcloneConfigName);
      
      account = db.query("SELECT * FROM accounts WHERE id = ?").get(result.lastInsertRowid) as any;
    } else {
      // If the password changed, update it for everyone
      db.query("UPDATE accounts SET webdav_password = ? WHERE id = ?").run(encryptedPassword, account.id);
    }

    // Link the user to the account 
    db.query(`
      INSERT INTO user_accounts (user_id, account_id, is_active) 
      VALUES (?, ?, 1) 
      ON CONFLICT(user_id, account_id) DO UPDATE SET is_active = 1
    `).run(userId, account.id);

    return account.id;
  } catch (e) {
    console.error("createAccount error:", e);
    return null;
  }
}

export function updateAccountSyncTime(accountId: number) {
  if (!db) return;
  try {
    db.query("UPDATE accounts SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?").run(accountId);
  } catch (e) {
    console.error("updateAccountSyncTime error:", e);
  }
}

// ── media & tv_episodes ────────────────────────────────────────────────────────

export function getMediaByTmdbId(tmdbId: number) {
  if (!db) return null;
  try {
    return db.query("SELECT * FROM media WHERE tmdb_id = ?").get(tmdbId) as any;
  } catch (e) {
    console.error("getMediaByTmdbId error:", e);
    return null;
  }
}

export function upsertMedia(
  tmdbId: number,
  title: string,
  year: string,
  posterUrl: string,
  mediaType: "movie" | "tv",
  backdropUrl?: string | null,
  overview?: string | null
) {
  if (!db) return;
  try {
    db.query(
      `INSERT INTO media (tmdb_id, title, year, poster_url, media_type, backdrop_url, overview, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(tmdb_id) DO UPDATE SET
         title        = excluded.title,
         year         = excluded.year,
         poster_url   = excluded.poster_url,
         media_type   = excluded.media_type,
         backdrop_url = COALESCE(excluded.backdrop_url, media.backdrop_url),
         overview     = COALESCE(excluded.overview, media.overview),
         updated_at   = CURRENT_TIMESTAMP`
    ).run(tmdbId, title, year, posterUrl, mediaType, backdropUrl ?? null, overview ?? null);
  } catch (e) {
    console.error("upsertMedia error:", e);
  }
}

export function upsertTvEpisode(
  showTmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  episodeTitle?: string | null,
  overview?: string | null,
  stillUrl?: string | null
) {
  if (!db) return;
  try {
    db.query(
      `INSERT INTO tv_episodes (show_tmdb_id, season_number, episode_number, episode_title, overview, still_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(show_tmdb_id, season_number, episode_number) DO UPDATE SET
         episode_title = COALESCE(excluded.episode_title, tv_episodes.episode_title),
         overview      = COALESCE(excluded.overview, tv_episodes.overview),
         still_url     = COALESCE(excluded.still_url, tv_episodes.still_url)`
    ).run(showTmdbId, seasonNumber, episodeNumber, episodeTitle ?? null, overview ?? null, stillUrl ?? null);
  } catch (e) {
    console.error("upsertTvEpisode error:", e);
  }
}

// ── remote_list_cache ──────────────────────────────────────────────────────────

export function upsertRemoteFile(
  accountId: number,
  remotePath: string,
  filename: string,
  size: number,
  mimeType: string,
  lastModified: string,
  tmdbId: number | null,
  rawTitle: string | null,
  rawYear: string | null,
  mediaType: "movie" | "tv" | "other" = "other",
  showTitle: string | null = null,
  seasonNumber: number | null = null,
  episodeNumber: number | null = null,
  episodeEndNumber: number | null = null,
  parsedYear: string | null = null
) {
  if (!db) return;
  try {
    db.query(
      `INSERT INTO remote_list_cache
         (account_id, remote_path, filename, size, mime_type, last_modified, tmdb_id, raw_title, raw_year, media_type, show_title, season_number, episode_number, episode_end_number, parsed_year, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(account_id, remote_path) DO UPDATE SET
         filename           = excluded.filename,
         size               = excluded.size,
         mime_type          = excluded.mime_type,
         last_modified      = excluded.last_modified,
         tmdb_id            = excluded.tmdb_id,
         raw_title          = excluded.raw_title,
         raw_year           = excluded.raw_year,
         media_type         = excluded.media_type,
         show_title         = excluded.show_title,
         season_number      = excluded.season_number,
         episode_number     = excluded.episode_number,
         episode_end_number = excluded.episode_end_number,
         parsed_year        = excluded.parsed_year,
         synced_at          = CURRENT_TIMESTAMP`
    ).run(
      accountId,
      remotePath,
      filename,
      size,
      mimeType,
      lastModified,
      tmdbId,
      rawTitle,
      rawYear,
      mediaType,
      showTitle,
      seasonNumber,
      episodeNumber,
      episodeEndNumber,
      parsedYear
    );
  } catch (e) {
    console.error("upsertRemoteFile error:", e);
  }
}

export function getFilesForAccount(accountId: number) {
  if (!db) return [];
  try {
    return db
      .query(
        `SELECT
           r.id,
           r.account_id,
           r.remote_path,
           r.filename,
           r.size,
           r.mime_type,
           r.last_modified,
           r.tmdb_id,
           r.raw_title,
           r.raw_year,
           r.media_type,
           r.show_title,
           r.season_number,
           r.episode_number,
           r.synced_at,
           m.title       AS media_title,
           m.year        AS media_year,
           m.poster_url  AS media_poster_url
         FROM remote_list_cache r
         LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
         WHERE r.account_id = ?
         ORDER BY COALESCE(m.title, r.show_title, r.raw_title, r.filename) ASC`
      )
      .all(accountId) as any[];
  } catch (e) {
    console.error("getFilesForAccount error:", e);
    return [];
  }
}

export function getMoviesForAccount(accountId: number) {
  if (!db) return [];
  try {
    return db
      .query(
        `SELECT
           r.id,
           r.account_id,
           r.remote_path,
           r.filename,
           r.size,
           r.mime_type,
           r.last_modified,
           r.tmdb_id,
           r.raw_title,
           r.raw_year,
           r.parsed_year,
           r.synced_at,
           m.title        AS media_title,
           m.year         AS media_year,
           m.poster_url   AS media_poster_url,
           m.backdrop_url AS media_backdrop_url,
           m.overview     AS media_overview
         FROM remote_list_cache r
         LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
         WHERE r.account_id = ? AND r.media_type = 'movie'
         ORDER BY COALESCE(m.title, r.raw_title, r.filename) ASC`
      )
      .all(accountId) as any[];
  } catch (e) {
    console.error("getMoviesForAccount error:", e);
    return [];
  }
}

export function getTvShowsForAccount(accountId: number) {
  if (!db) return [];
  try {
    return db
      .query(
        `SELECT
           COALESCE(r.show_title, m.title, r.raw_title) AS show_title,
           m.tmdb_id,
           m.poster_url,
           m.backdrop_url,
           m.overview,
           COUNT(DISTINCT r.season_number) AS season_count,
           COUNT(r.id) AS episode_count,
           MIN(r.parsed_year) AS start_year
         FROM remote_list_cache r
         LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
         WHERE r.account_id = ? AND r.media_type = 'tv'
         GROUP BY COALESCE(r.show_title, m.title, r.raw_title)
         ORDER BY show_title ASC`
      )
      .all(accountId) as any[];
  } catch (e) {
    console.error("getTvShowsForAccount error:", e);
    return [];
  }
}

export function getTvShowDetailsForAccount(accountId: number, showTitle: string) {
  if (!db) return null;
  try {
    const episodes = db
      .query(
        `SELECT
           r.id,
           r.account_id,
           r.remote_path,
           r.filename,
           r.size,
           r.mime_type,
           r.last_modified,
           r.tmdb_id,
           r.show_title,
           r.season_number,
           r.episode_number,
           r.episode_end_number,
           r.parsed_year,
           r.synced_at,
           m.title        AS show_name,
           m.poster_url   AS show_poster_url,
           m.backdrop_url AS show_backdrop_url,
           m.overview     AS show_overview,
           e.episode_title,
           e.overview     AS episode_overview,
           e.still_url    AS episode_still_url
         FROM remote_list_cache r
         LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
         LEFT JOIN tv_episodes e ON (r.tmdb_id = e.show_tmdb_id AND r.season_number = e.season_number AND r.episode_number = e.episode_number)
         WHERE r.account_id = ? AND r.media_type = 'tv' AND LOWER(r.show_title) = LOWER(?)
         ORDER BY r.season_number ASC, r.episode_number ASC`
      )
      .all(accountId, showTitle) as any[];

    return episodes;
  } catch (e) {
    console.error("getTvShowDetailsForAccount error:", e);
    return null;
  }
}

export function getOtherFilesForAccount(accountId: number) {
  if (!db) return [];
  try {
    return db
      .query(
        `SELECT * FROM remote_list_cache
         WHERE account_id = ? AND (media_type = 'other' OR media_type IS NULL)
         ORDER BY filename ASC`
      )
      .all(accountId) as any[];
  } catch (e) {
    console.error("getOtherFilesForAccount error:", e);
    return [];
  }
}

export function clearRemoteFilesForAccount(accountId: number) {
  if (!db) return;
  try {
    db.query("DELETE FROM remote_list_cache WHERE account_id = ?").run(accountId);
  } catch (e) {
    console.error("clearRemoteFilesForAccount error:", e);
  }
}

// ── legacy metadata_cache ──────────────────────────────────────────────────────

export function getMetadata(filename: string) {
  if (!db) return null;
  try {
    return db.query("SELECT * FROM metadata_cache WHERE filename = ?").get(filename) as any;
  } catch (error) {
    console.error("Failed to get metadata:", error);
    return null;
  }
}

export function setMetadata(filename: string, title: string, year: string, posterUrl: string) {
  if (!db) return;
  try {
    db.query(
      `INSERT OR REPLACE INTO metadata_cache (filename, title, year, poster_url, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(filename, title, year, posterUrl);
  } catch (error) {
    console.error("Failed to set metadata:", error);
  }
}
