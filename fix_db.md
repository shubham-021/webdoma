# Dune Prophecy TV card 404 after sync

**Session ID:** ses_027a1d139ffegZv0nRAHXTjlIU
**Created:** 8/7/2026, 12:07:58 AM
**Updated:** 8/7/2026, 12:09:27 AM

---

## User

in this project, when i add an account with ajaydl1@atomicmail.io
the show Dune Prophecy has a card in tv show tab, but when i click it, it does not show any shows, responses a 404 error, 

TMDB_API_KEY=920362f85431762ffe89c61f2d41e655
SESSION_SECRET=m2Cfrb+Gwf5RtTK0Xkp+ghQQ8h5iJV1Jxzt0oPCGSIE=
AEMOND_CRED_KEY=90cb810c7e3afd64abb761e6880f55918dfa07798adfa8e284badd93683b4c7a
TB_SB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanhmeXRrbm5rb2VndHRldXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxMjgzMzAsImV4cCI6MjA0NDcwNDMzMH0.vIQWcZuN6Nx3DnkmsWLK25J8BM3TTA_8Tb4GoK99MqM 

present in @app/api/sync/route.ts check .sqlite database in ./data/

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 8.0s)

_Thinking:_

Let me understand the problem. The user says when adding an account with ajaydl1@atomicmail.io, "Dune Prophecy" shows a card in the TV show tab, but clicking it returns a 404 error and doesn't show any shows. This involves the sync route and a .sqlite database in ./data/.

Let me explore the codebase to understand:
1. How accounts are synced
2. How TV shows are displayed
3. Why Dune Prophecy might 404

Let me look at the project structure first.

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la && ls data/ 2>/dev/null && cat package.json | head -50"
}
```

**Output:**
```
total 244
drwxr-xr-x  10 kshiyo kshiyo   4096 Aug  6 23:44 .
drwxr-xr-x   9 kshiyo kshiyo   4096 Aug  6 23:42 ..
-rw-r--r--   1 kshiyo kshiyo    327 Aug  6 23:42 AGENTS.md
drwxr-xr-x   6 kshiyo kshiyo   4096 Aug  6 23:42 app
-rw-r--r--   1 kshiyo kshiyo 136721 Aug  6 23:42 bun.lock
drwxr-xr-x   3 kshiyo kshiyo   4096 Aug  6 23:42 components
-rw-r--r--   1 kshiyo kshiyo    415 Aug  6 23:42 components.json
drwxr-xr-x   2 kshiyo kshiyo   4096 Aug  6 23:43 data
-rw-r--r--   1 kshiyo kshiyo    383 Aug  6 23:42 Dockerfile
-rw-r--r--   1 kshiyo kshiyo     76 Aug  6 23:42 .dockerignore
-rw-r--r--   1 kshiyo kshiyo    411 Aug  6 23:43 .env
-rw-r--r--   1 kshiyo kshiyo     46 Aug  6 23:42 .env.example
-rw-r--r--   1 kshiyo kshiyo    465 Aug  6 23:42 eslint.config.mjs
drwxr-xr-x   7 kshiyo kshiyo   4096 Aug  7 00:01 .git
-rw-r--r--   1 kshiyo kshiyo    471 Aug  6 23:42 .gitignore
drwxr-xr-x   2 kshiyo kshiyo   4096 Aug  6 23:42 lib
drwxr-xr-x   9 kshiyo kshiyo   4096 Aug  6 23:43 .next
-rw-r--r--   1 kshiyo kshiyo    171 Aug  6 23:42 next.config.ts
-rw-r--r--   1 kshiyo kshiyo    247 Aug  6 23:42 next-env.d.ts
drwxr-xr-x 318 kshiyo kshiyo  12288 Aug  6 23:42 node_modules
-rw-r--r--   1 kshiyo kshiyo   1400 Aug  6 23:44 package.json
-rw-r--r--   1 kshiyo kshiyo     94 Aug  6 23:42 postcss.config.mjs
drwxr-xr-x   2 kshiyo kshiyo   4096 Aug  6 23:42 public
-rw-r--r--   1 kshiyo kshiyo   2991 Aug  6 23:42 README.md
-rw-r--r--   1 kshiyo kshiyo     62 Aug  6 23:42 test-motion.ts
-rw-r--r--   1 kshiyo kshiyo    666 Aug  6 23:42 tsconfig.json
metadata.sqlite
metadata.sqlite-shm
metadata.sqlite-wal
{
  "name": "webdoma",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "bun --bun run next dev",
    "build": "bun --bun run next build",
    "start": "bun --bun run next start --port 9069",
    "lint": "eslint"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.23",
    "@radix-ui/react-dropdown-menu": "^2.1.24",
    "@radix-ui/react-select": "^2.3.7",
    "@radix-ui/react-separator": "^1.1.15",
    "@radix-ui/react-slot": "^1.3.3",
    "@radix-ui/react-tabs": "^1.1.21",
    "@radix-ui/react-toggle": "^1.1.18",
    "@radix-ui/react-toggle-group": "^1.1.19",
    "@radix-ui/react-tooltip": "^1.2.16",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "iron-session": "^8.0.4",
    "lucide-react": "^1.28.0",
    "motion": "^13.0.0",
    "next": "16.2.12",
    "next-themes": "^0.4.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bun": "^1.3.14",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.12",
    "tailwindcss": "^4",
    "typescript": "^5"
  },
  "ignoreScripts": [
    "sharp",
    "unrs-resolver"
  ],
  "trustedDependencies": [

```

**Tool: glob**

**Input:**
```json
{
  "pattern": "lib/**/*.ts"
}
```

**Output:**
```
/home/kshiyo/servers/webdoma/lib/torbox.ts
/home/kshiyo/servers/webdoma/lib/constants.ts
/home/kshiyo/servers/webdoma/lib/sync.ts
/home/kshiyo/servers/webdoma/lib/store.ts
/home/kshiyo/servers/webdoma/lib/session.ts
/home/kshiyo/servers/webdoma/lib/server-cache.ts
/home/kshiyo/servers/webdoma/lib/utils.ts
/home/kshiyo/servers/webdoma/lib/players.ts
/home/kshiyo/servers/webdoma/lib/torbox-config.ts
/home/kshiyo/servers/webdoma/lib/parser.ts
/home/kshiyo/servers/webdoma/lib/types.ts
/home/kshiyo/servers/webdoma/lib/crypto.ts
/home/kshiyo/servers/webdoma/lib/db.ts
```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 2.6s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/kshiyo/servers/webdoma/lib/sync.ts"
}
```

**Output:**
```
<path>/home/kshiyo/servers/webdoma/lib/sync.ts</path>
<type>file</type>
<content>
1: /**
2:  * lib/sync.ts
3:  * Sync Engine (TorBox API):
4:  * 1. Get a valid access token (auto-refreshes if needed).
5:  * 2. Fetch all torrents + files via GET /v1/api/torrents/mylist.
6:  * 3. Filter files by minimum size threshold.
7:  * 4. Parse filename using lib/parser (detecting TV Show S01E01 / Movie / Other).
8:  * 5. Fetch rich metadata (posters, backdrops, episode titles, stills) from TMDB.
9:  * 6. Save structured records into remote_list_cache, media, and tv_episodes tables.
10:  */
11: 
12: import {
13:   updateAccountSyncTime,
14:   clearRemoteFilesForAccount,
15:   upsertRemoteFile,
16:   upsertMedia,
17:   upsertTvEpisode,
18: } from "./db";
19: import { getValidAccessToken, fetchTorrentList } from "./torbox";
20: import { MIN_FILE_SIZE_BYTES } from "./torbox-config";
21: import { VIDEO_EXTENSIONS } from "./constants";
22: import { parseMediaFilename, type ParsedMedia } from "./parser";
23: 
24: const TMDB_API_KEY = process.env.TMDB_API_KEY;
25: 
26: function isVideoFile(filename: string, mimetype?: string): boolean {
27:   // Prefer mimetype check if available
28:   if (mimetype && mimetype.startsWith("video/")) return true;
29:   // Fallback to extension check
30:   const ext = filename.split(".").pop()?.toLowerCase() || "";
31:   return VIDEO_EXTENSIONS.has(ext);
32: }
33: 
34: // In-memory set to avoid re-fetching season details multiple times in a single sync
35: const fetchedSeasonKeys = new Set<string>();
36: 
37: async function searchTmdbMovie(title: string, year?: string) {
38:   if (!TMDB_API_KEY) return null;
39: 
40:   const fetchMovie = async (searchYear?: string) => {
41:     let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
42:     if (searchYear) url += `&primary_release_year=${searchYear}`;
43:     const res = await fetch(url);
44:     const data = await res.json();
45:     return data.results?.[0] || null;
46:   };
47: 
48:   try {
49:     let result = await fetchMovie(year);
50:     if (result) return result;
51: 
52:     // Retry with -1 and +1 year concurrently if exact year failed
53:     if (year) {
54:       const yearNum = parseInt(year, 10);
55:       if (!isNaN(yearNum)) {
56:         const [prev, next] = await Promise.all([
57:           fetchMovie(String(yearNum - 1)),
58:           fetchMovie(String(yearNum + 1))
59:         ]);
60:         if (prev) return prev;
61:         if (next) return next;
62:       }
63:     }
64: 
65:     // Final fallback without year restriction
66:     if (year) return await fetchMovie();
67: 
68:     return null;
69:   } catch (e) {
70:     console.error("TMDB movie search error:", e);
71:     return null;
72:   }
73: }
74: 
75: async function searchTmdbTv(title: string, year?: string) {
76:   if (!TMDB_API_KEY) return null;
77: 
78:   const fetchTv = async (searchYear?: string) => {
79:     let url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
80:     if (searchYear) url += `&first_air_date_year=${searchYear}`;
81:     const res = await fetch(url);
82:     const data = await res.json();
83:     return data.results?.[0] || null;
84:   };
85: 
86:   try {
87:     let result = await fetchTv(year);
88:     if (result) return result;
89: 
90:     // Retry with -1 and +1 year concurrently if exact year failed
91:     if (year) {
92:       const yearNum = parseInt(year, 10);
93:       if (!isNaN(yearNum)) {
94:         const [prev, next] = await Promise.all([
95:           fetchTv(String(yearNum - 1)),
96:           fetchTv(String(yearNum + 1))
97:         ]);
98:         if (prev) return prev;
99:         if (next) return next;
100:       }
101:     }
102: 
103:     // Final fallback without year restriction
104:     if (year) return await fetchTv();
105: 
106:     return null;
107:   } catch (e) {
108:     console.error("TMDB TV search error:", e);
109:     return null;
110:   }
111: }
112: 
113: async function fetchAndSaveSeasonEpisodes(showTmdbId: number, seasonNumber: number) {
114:   if (!TMDB_API_KEY || seasonNumber <= 0) return;
115:   const key = `${showTmdbId}-S${seasonNumber}`;
116:   if (fetchedSeasonKeys.has(key)) return;
117: 
118:   try {
119:     const url = `https://api.themoviedb.org/3/tv/${showTmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`;
120:     const res = await fetch(url);
121:     if (!res.ok) return;
122:     const data = await res.json();
123: 
124:     if (data && Array.isArray(data.episodes)) {
125:       for (const ep of data.episodes) {
126:         const episodeNumber = ep.episode_number;
127:         const episodeTitle = ep.name || `Episode ${episodeNumber}`;
128:         const overview = ep.overview || null;
129:         const stillUrl = ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null;
130: 
131:         upsertTvEpisode(showTmdbId, seasonNumber, episodeNumber, episodeTitle, overview, stillUrl);
132:       }
133:       fetchedSeasonKeys.add(key);
134:     }
135:   } catch (e) {
136:     console.error(`Failed to fetch season ${seasonNumber} for show ${showTmdbId}:`, e);
137:   }
138: }
139: 
140: export interface SyncResult {
141:   success: boolean;
142:   filesSynced: number;
143:   error?: string;
144: }
145: 
146: /**
147:  * Standalone file-processing pipeline.
148:  * Parses the filename, looks up TMDB metadata, and upserts into
149:  * remote_list_cache (+ media / tv_episodes when matched).
150:  *
151:  * Called by both:
152:  *  – syncAccount (full resync)
153:  *  – POST /api/torrent/create (inline insert after adding a torrent)
154:  *
155:  * Returns true if the file was inserted, false if skipped.
156:  */
157: export async function processAndInsertFile(
158:   accountId: number,
159:   torrentId: number,
160:   torrentHash: string | null,
161:   file: {
162:     id: number;
163:     name: string;
164:     short_name?: string;
165:     size: number;
166:     mimetype?: string;
167:   },
168:   options?: { skipSizeFilter?: boolean }
169: ): Promise<boolean> {
170:   const { skipSizeFilter = false } = options || {};
171: 
172:   // Filter by minimum file size (skip for inline inserts where cache already filtered)
173:   if (!skipSizeFilter && file.size < MIN_FILE_SIZE_BYTES) return false;
174: 
175:   const remotePath = file.name; // e.g. "Movie Folder/Movie.mkv"
176:   const filename = file.short_name || remotePath.split("/").pop() || remotePath;
177:   const shortName = file.short_name || null;
178:   const mimeType = file.mimetype || "application/octet-stream";
179: 
180:   if (!isVideoFile(filename, file.mimetype)) {
181:     // Non-video file above size threshold — store as 'other'
182:     upsertRemoteFile(
183:       accountId, torrentId, file.id,
184:       remotePath, filename, shortName,
185:       file.size, mimeType, torrentHash,
186:       null, null, null, "other"
187:     );
188:     return true;
189:   }
190: 
191:   // Parse filename using parser
192:   const parsed: ParsedMedia = parseMediaFilename(filename);
193: 
194:   let tmdbId: number | null = null;
195:   let mediaType: "movie" | "tv" | "other" = "other";
196: 
197:   if (parsed.mediaType === "tv") {
198:     const tvResult = await searchTmdbTv(parsed.title, parsed.year);
199:     if (tvResult) {
200:       const showTmdbId = tvResult.id as number;
201:       tmdbId = showTmdbId;
202:       const showTitle = tvResult.name || parsed.title;
203:       const posterUrl = tvResult.poster_path ? `https://image.tmdb.org/t/p/w500${tvResult.poster_path}` : "";
204:       const backdropUrl = tvResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvResult.backdrop_path}` : "";
205:       const firstAir = tvResult.first_air_date ? tvResult.first_air_date.split("-")[0] : parsed.year || "";
206: 
207:       upsertMedia(showTmdbId, showTitle, firstAir, posterUrl, "tv", backdropUrl, tvResult.overview);
208: 
209:       if (parsed.season !== undefined && parsed.season > 0) {
210:         await fetchAndSaveSeasonEpisodes(showTmdbId, parsed.season);
211:       }
212:       mediaType = "tv";
213:     } else {
214:       // SxxEyy present but not matched on TMDB — still classify as 'tv'
215:       mediaType = "tv";
216:     }
217:   } else {
218:     // Try TMDB Movie first
219:     const movieResult = await searchTmdbMovie(parsed.title, parsed.year);
220:     if (movieResult) {
221:       const movieTmdbId = movieResult.id as number;
222:       tmdbId = movieTmdbId;
223:       const movieTitle = movieResult.title || parsed.title;
224:       const posterUrl = movieResult.poster_path ? `https://image.tmdb.org/t/p/w500${movieResult.poster_path}` : "";
225:       const backdropUrl = movieResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movieResult.backdrop_path}` : "";
226:       const releaseYear = movieResult.release_date ? movieResult.release_date.split("-")[0] : parsed.year || "";
227: 
228:       upsertMedia(movieTmdbId, movieTitle, releaseYear, posterUrl, "movie", backdropUrl, movieResult.overview);
229:       mediaType = "movie";
230:     } else {
231:       // Try TMDB TV as fallback
232:       const tvResult = await searchTmdbTv(parsed.title, parsed.year);
233:       if (tvResult) {
234:         const showTmdbId = tvResult.id as number;
235:         tmdbId = showTmdbId;
236:         const showTitle = tvResult.name || parsed.title;
237:         const posterUrl = tvResult.poster_path ? `https://image.tmdb.org/t/p/w500${tvResult.poster_path}` : "";
238:         const backdropUrl = tvResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvResult.backdrop_path}` : "";
239:         const firstAir = tvResult.first_air_date ? tvResult.first_air_date.split("-")[0] : parsed.year || "";
240: 
241:         upsertMedia(showTmdbId, showTitle, firstAir, posterUrl, "tv", backdropUrl, tvResult.overview);
242: 
243:         if (parsed.season !== undefined && parsed.season > 0) {
244:           await fetchAndSaveSeasonEpisodes(showTmdbId, parsed.season);
245:         }
246:         mediaType = "tv";
247:       } else {
248:         mediaType = "other";
249:       }
250:     }
251:   }
252: 
253:   const epStart = parsed.episodes && parsed.episodes.length > 0 ? parsed.episodes[0] : null;
254:   const epEnd = parsed.episodes && parsed.episodes.length > 1 ? parsed.episodes[parsed.episodes.length - 1] : null;
255: 
256:   upsertRemoteFile(
257:     accountId,
258:     torrentId,
259:     file.id,
260:     remotePath,
261:     filename,
262:     shortName,
263:     file.size,
264:     mimeType,
265:     torrentHash,
266:     tmdbId,
267:     parsed.title,
268:     parsed.year || null,
269:     mediaType,
270:     mediaType === "tv" ? parsed.title : null,
271:     parsed.season ?? null,
272:     epStart,
273:     epEnd,
274:     parsed.year || null
275:   );
276: 
277:   return true;
278: }
279: 
280: export async function syncAccount(accountId: number): Promise<SyncResult> {
281:   try {
282:     // 1. Get a valid access token (auto-refreshes if expired)
283:     let accessToken: string;
284:     try {
285:       accessToken = await getValidAccessToken(accountId);
286:     } catch (e: any) {
287:       return { success: false, filesSynced: 0, error: e.message || "Failed to authenticate" };
288:     }
289: 
290:     // 2. Fetch torrent list from TorBox API
291:     let torrents;
292:     try {
293:       torrents = await fetchTorrentList(accessToken);
294:     } catch (e: any) {
295:       if (e.status === 429) {
296:         return { success: false, filesSynced: 0, error: "TorBox rate limit exceeded" };
297:       }
298:       return { success: false, filesSynced: 0, error: e.message || "Failed to fetch torrent list" };
299:     }
300: 
301:     // 3. Clear all existing remote_list_cache rows for this account (clean slate)
302:     //    NOTE: media & tv_episodes tables are NOT cleared — they are shared metadata caches.
303:     clearRemoteFilesForAccount(accountId);
304: 
305:     let filesSynced = 0;
306: 
307:     // 4. Process each torrent and its files through the shared pipeline
308:     for (const torrent of torrents) {
309:       const torrentId = torrent.id;
310:       const torrentHash = torrent.hash || null;
311: 
312:       if (!torrent.files || !Array.isArray(torrent.files)) continue;
313: 
314:       for (const file of torrent.files) {
315:         const inserted = await processAndInsertFile(
316:           accountId,
317:           torrentId,
318:           torrentHash,
319:           file
320:         );
321:         if (inserted) filesSynced++;
322:       }
323:     }
324: 
325:     updateAccountSyncTime(accountId);
326:     return { success: true, filesSynced };
327:   } catch (error) {
328:     console.error("Sync error:", error);
329:     return { success: false, filesSynced: 0, error: "Sync failed" };
330:   }
331: }

(End of file - total 331 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/kshiyo/servers/webdoma/lib/db.ts"
}
```

**Output:**
```
<path>/home/kshiyo/servers/webdoma/lib/db.ts</path>
<type>file</type>
<content>
1: import { Database } from "bun:sqlite";
2: import { existsSync, mkdirSync } from "node:fs";
3: 
4: if (!existsSync("./data")) {
5:   mkdirSync("./data", { recursive: true });
6: }
7: 
8: let db: any;
9: 
10: const globalForDb = globalThis as unknown as { __domaDb: any };
11: 
12: try {
13:   if (!globalForDb.__domaDb) {
14:     globalForDb.__domaDb = new Database("./data/metadata.sqlite", { create: true });
15: 
16:     // Enable WAL mode and set busy timeout for better concurrent read/write performance
17:     globalForDb.__domaDb.query("PRAGMA journal_mode = WAL").run();
18:     globalForDb.__domaDb.query("PRAGMA busy_timeout = 5000").run();
19:     globalForDb.__domaDb.query("PRAGMA foreign_keys = ON").run();
20: 
21:     // Schema Migration: detect old schema and migrate 
22:     // Check if accounts table has old webdav columns
23:     try {
24:       const tableInfo = globalForDb.__domaDb
25:         .query("PRAGMA table_info(accounts)")
26:         .all() as { name: string }[];
27:       const columnNames = tableInfo.map((c) => c.name);
28: 
29:       if (columnNames.includes("webdav_username")) {
30:         // Old schema detected - drop and recreate accounts + remote_list_cache
31:         console.log("[DB Migration] Old WebDAV schema detected — migrating to TorBox API schema...");
32:         globalForDb.__domaDb.query("DROP TABLE IF EXISTS user_accounts").run();
33:         globalForDb.__domaDb.query("DROP TABLE IF EXISTS remote_list_cache").run();
34:         globalForDb.__domaDb.query("DROP TABLE IF EXISTS tv_episodes").run();
35:         globalForDb.__domaDb.query("DROP TABLE IF EXISTS media").run();
36:         globalForDb.__domaDb.query("DROP TABLE IF EXISTS accounts").run();
37:         console.log("[DB Migration] Old tables dropped. Recreating with new schema...");
38:       }
39:     } catch (_) {
40:       // No existing accounts table — fresh install
41:     }
42: 
43:     // users
44:     globalForDb.__domaDb
45:       .query(
46:         `
47:       CREATE TABLE IF NOT EXISTS users (
48:         id        INTEGER PRIMARY KEY AUTOINCREMENT,
49:         username  TEXT    NOT NULL UNIQUE,
50:         password  TEXT    NOT NULL,          -- bcrypt hash
51:         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
52:       )
53:     `
54:       )
55:       .run();
56: 
57:     // accounts (TorBox accounts)
58:     globalForDb.__domaDb
59:       .query(
60:         `
61:       CREATE TABLE IF NOT EXISTS accounts (
62:         id               INTEGER PRIMARY KEY AUTOINCREMENT,
63:         torbox_email     TEXT    NOT NULL,
64:         torbox_password  TEXT    NOT NULL,          -- AES-256-GCM encrypted
65:         access_token     TEXT,
66:         refresh_token    TEXT,
67:         token_expires_at INTEGER,                   -- unix timestamp (seconds)
68:         last_synced_at   DATETIME,
69:         created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
70:         UNIQUE(torbox_email)
71:       )
72:     `
73:       )
74:       .run();
75: 
76:     // user_accounts (Junction Table)
77:     globalForDb.__domaDb
78:       .query(
79:         `
80:       CREATE TABLE IF NOT EXISTS user_accounts (
81:         user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
82:         account_id       INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
83:         is_active        INTEGER NOT NULL DEFAULT 1,
84:         created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
85:         PRIMARY KEY (user_id, account_id)
86:       )
87:     `
88:       )
89:       .run();
90: 
91:     // media
92:     globalForDb.__domaDb
93:       .query(
94:         `
95:       CREATE TABLE IF NOT EXISTS media (
96:         tmdb_id      INTEGER PRIMARY KEY,
97:         title        TEXT    NOT NULL,
98:         year         TEXT,
99:         poster_url   TEXT,
100:         backdrop_url TEXT,
101:         overview     TEXT,
102:         media_type   TEXT    NOT NULL DEFAULT 'movie', -- 'movie' | 'tv'
103:         updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
104:       )
105:     `
106:       )
107:       .run();
108: 
109:     // remote_list_cache
110:     globalForDb.__domaDb
111:       .query(
112:         `
113:       CREATE TABLE IF NOT EXISTS remote_list_cache (
114:         id                 INTEGER PRIMARY KEY AUTOINCREMENT,
115:         account_id         INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
116:         torrent_id         INTEGER NOT NULL,
117:         file_id            INTEGER NOT NULL,
118:         remote_path        TEXT    NOT NULL,          -- files[].name from TorBox API
119:         filename           TEXT    NOT NULL,          -- basename
120:         short_name         TEXT,
121:         size               INTEGER NOT NULL DEFAULT 0,
122:         mime_type          TEXT,
123:         torrent_hash       TEXT,
124:         tmdb_id            INTEGER REFERENCES media(tmdb_id) ON DELETE SET NULL,
125:         raw_title          TEXT,
126:         raw_year           TEXT,
127:         media_type         TEXT DEFAULT 'other',      -- 'movie' | 'tv' | 'other'
128:         show_title         TEXT,
129:         season_number      INTEGER,
130:         episode_number     INTEGER,
131:         episode_end_number INTEGER,
132:         parsed_year        TEXT,
133:         synced_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
134:         UNIQUE(account_id, torrent_id, file_id)
135:       )
136:     `
137:       )
138:       .run();
139: 
140:     // tv_episodes
141:     globalForDb.__domaDb
142:       .query(
143:         `
144:       CREATE TABLE IF NOT EXISTS tv_episodes (
145:         id             INTEGER PRIMARY KEY AUTOINCREMENT,
146:         show_tmdb_id   INTEGER NOT NULL REFERENCES media(tmdb_id) ON DELETE CASCADE,
147:         season_number  INTEGER NOT NULL,
148:         episode_number INTEGER NOT NULL,
149:         episode_title  TEXT,
150:         overview       TEXT,
151:         still_url      TEXT,
152:         created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
153:         UNIQUE(show_tmdb_id, season_number, episode_number)
154:       )
155:     `
156:       )
157:       .run();
158: 
159:     // metadata_cache (legacy)
160:     globalForDb.__domaDb
161:       .query(
162:         `
163:       CREATE TABLE IF NOT EXISTS metadata_cache (
164:         filename TEXT PRIMARY KEY,
165:         title TEXT,
166:         year TEXT,
167:         poster_url TEXT,
168:         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
169:       )
170:     `
171:       )
172:       .run();
173: 
174:     // Safe column additions for existing databases (idempotent)
175:     try { globalForDb.__domaDb.query("ALTER TABLE media ADD COLUMN backdrop_url TEXT").run(); } catch (_) { }
176:     try { globalForDb.__domaDb.query("ALTER TABLE media ADD COLUMN overview TEXT").run(); } catch (_) { }
177:   }
178: 
179:   db = globalForDb.__domaDb;
180: } catch (error) {
181:   console.error("Failed to initialize bun:sqlite:", error);
182: }
183: 
184: export function getDb() {
185:   return db;
186: }
187: 
188: // users
189: 
190: export function getUserByUsername(username: string) {
191:   if (!db) return null;
192:   try {
193:     return db.query("SELECT * FROM users WHERE username = ?").get(username) as any;
194:   } catch (e) {
195:     console.error("getUserByUsername error:", e);
196:     return null;
197:   }
198: }
199: 
200: export function getUserById(id: number) {
201:   if (!db) return null;
202:   try {
203:     return db.query("SELECT * FROM users WHERE id = ?").get(id) as any;
204:   } catch (e) {
205:     console.error("getUserById error:", e);
206:     return null;
207:   }
208: }
209: 
210: export function createUser(username: string, hashedPassword: string): number | null {
211:   if (!db) return null;
212:   try {
213:     const result = db
214:       .query("INSERT INTO users (username, password) VALUES (?, ?)")
215:       .run(username, hashedPassword);
216:     return result.lastInsertRowid as number;
217:   } catch (e) {
218:     console.error("createUser error:", e);
219:     return null;
220:   }
221: }
222: 
223: // accounts
224: 
225: export function getAccountsByUserId(userId: number) {
226:   if (!db) return [];
227:   try {
228:     return db
229:       .query(`
230:         SELECT a.id, a.torbox_email, a.last_synced_at, ua.is_active 
231:         FROM accounts a
232:         JOIN user_accounts ua ON ua.account_id = a.id
233:         WHERE ua.user_id = ?
234:         ORDER BY a.created_at ASC
235:       `)
236:       .all(userId) as any[];
237:   } catch (e) {
238:     console.error("getAccountsByUserId error:", e);
239:     return [];
240:   }
241: }
242: 
243: export function getAccountById(accountId: number) {
244:   if (!db) return null;
245:   try {
246:     return db.query("SELECT * FROM accounts WHERE id = ?").get(accountId) as any;
247:   } catch (e) {
248:     console.error("getAccountById error:", e);
249:     return null;
250:   }
251: }
252: 
253: export function verifyUserAccountAccess(userId: number, accountId: number): boolean {
254:   if (!db) return false;
255:   try {
256:     const link = db.query("SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?").get(userId, accountId);
257:     return !!link;
258:   } catch (e) {
259:     console.error("verifyUserAccountAccess error:", e);
260:     return false;
261:   }
262: }
263: 
264: export function getAccountByEmail(userId: number, torboxEmail: string) {
265:   if (!db) return null;
266:   try {
267:     return db
268:       .query(`
269:         SELECT a.*, ua.is_active 
270:         FROM accounts a
271:         JOIN user_accounts ua ON ua.account_id = a.id
272:         WHERE ua.user_id = ? AND a.torbox_email = ?
273:       `)
274:       .get(userId, torboxEmail) as any;
275:   } catch (e) {
276:     console.error("getAccountByEmail error:", e);
277:     return null;
278:   }
279: }
280: 
281: export function createAccount(
282:   userId: number,
283:   torboxEmail: string,
284:   encryptedPassword: string,
285:   accessToken?: string,
286:   refreshToken?: string,
287:   tokenExpiresAt?: number
288: ): number | null {
289:   if (!db) return null;
290:   try {
291:     const user = getUserById(userId);
292:     if (!user) return null;
293: 
294:     let account = db.query("SELECT * FROM accounts WHERE torbox_email = ? LIMIT 1").get(torboxEmail) as any;
295: 
296:     if (!account) {
297:       // Create new TorBox account
298:       const result = db
299:         .query(
300:           `INSERT INTO accounts (torbox_email, torbox_password, access_token, refresh_token, token_expires_at)
301:            VALUES (?, ?, ?, ?, ?)`
302:         )
303:         .run(
304:           torboxEmail,
305:           encryptedPassword,
306:           accessToken ?? null,
307:           refreshToken ?? null,
308:           tokenExpiresAt ?? null
309:         );
310: 
311:       account = db.query("SELECT * FROM accounts WHERE id = ?").get(result.lastInsertRowid) as any;
312:     } else {
313:       // Account already exists — update password and tokens
314:       db.query(
315:         `UPDATE accounts 
316:          SET torbox_password = ?, access_token = ?, refresh_token = ?, token_expires_at = ?
317:          WHERE id = ?`
318:       ).run(
319:         encryptedPassword,
320:         accessToken ?? null,
321:         refreshToken ?? null,
322:         tokenExpiresAt ?? null,
323:         account.id
324:       );
325:     }
326: 
327:     // Link the user to the account 
328:     db.query(`
329:       INSERT INTO user_accounts (user_id, account_id, is_active) 
330:       VALUES (?, ?, 1) 
331:       ON CONFLICT(user_id, account_id) DO UPDATE SET is_active = 1
332:     `).run(userId, account.id);
333: 
334:     return account.id;
335:   } catch (e) {
336:     console.error("createAccount error:", e);
337:     return null;
338:   }
339: }
340: 
341: export function updateAccountTokens(
342:   accountId: number,
343:   accessToken: string,
344:   refreshToken: string,
345:   tokenExpiresAt: number
346: ) {
347:   if (!db) return;
348:   try {
349:     db.query(
350:       `UPDATE accounts 
351:        SET access_token = ?, refresh_token = ?, token_expires_at = ?
352:        WHERE id = ?`
353:     ).run(accessToken, refreshToken, tokenExpiresAt, accountId);
354:   } catch (e) {
355:     console.error("updateAccountTokens error:", e);
356:   }
357: }
358: 
359: export function updateAccountSyncTime(accountId: number) {
360:   if (!db) return;
361:   try {
362:     db.query("UPDATE accounts SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?").run(accountId);
363:   } catch (e) {
364:     console.error("updateAccountSyncTime error:", e);
365:   }
366: }
367: 
368: // media & tv_episodes
369: 
370: export function getMediaByTmdbId(tmdbId: number) {
371:   if (!db) return null;
372:   try {
373:     return db.query("SELECT * FROM media WHERE tmdb_id = ?").get(tmdbId) as any;
374:   } catch (e) {
375:     console.error("getMediaByTmdbId error:", e);
376:     return null;
377:   }
378: }
379: 
380: export function upsertMedia(
381:   tmdbId: number,
382:   title: string,
383:   year: string,
384:   posterUrl: string,
385:   mediaType: "movie" | "tv",
386:   backdropUrl?: string | null,
387:   overview?: string | null
388: ) {
389:   if (!db) return;
390:   try {
391:     db.query(
392:       `INSERT INTO media (tmdb_id, title, year, poster_url, media_type, backdrop_url, overview, updated_at)
393:        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
394:        ON CONFLICT(tmdb_id) DO UPDATE SET
395:          title        = excluded.title,
396:          year         = excluded.year,
397:          poster_url   = excluded.poster_url,
398:          media_type   = excluded.media_type,
399:          backdrop_url = COALESCE(excluded.backdrop_url, media.backdrop_url),
400:          overview     = COALESCE(excluded.overview, media.overview),
401:          updated_at   = CURRENT_TIMESTAMP`
402:     ).run(tmdbId, title, year, posterUrl, mediaType, backdropUrl ?? null, overview ?? null);
403:   } catch (e) {
404:     console.error("upsertMedia error:", e);
405:   }
406: }
407: 
408: export function upsertTvEpisode(
409:   showTmdbId: number,
410:   seasonNumber: number,
411:   episodeNumber: number,
412:   episodeTitle?: string | null,
413:   overview?: string | null,
414:   stillUrl?: string | null
415: ) {
416:   if (!db) return;
417:   try {
418:     db.query(
419:       `INSERT INTO tv_episodes (show_tmdb_id, season_number, episode_number, episode_title, overview, still_url)
420:        VALUES (?, ?, ?, ?, ?, ?)
421:        ON CONFLICT(show_tmdb_id, season_number, episode_number) DO UPDATE SET
422:          episode_title = COALESCE(excluded.episode_title, tv_episodes.episode_title),
423:          overview      = COALESCE(excluded.overview, tv_episodes.overview),
424:          still_url     = COALESCE(excluded.still_url, tv_episodes.still_url)`
425:     ).run(showTmdbId, seasonNumber, episodeNumber, episodeTitle ?? null, overview ?? null, stillUrl ?? null);
426:   } catch (e) {
427:     console.error("upsertTvEpisode error:", e);
428:   }
429: }
430: 
431: // remote_list_cache
432: 
433: export function upsertRemoteFile(
434:   accountId: number,
435:   torrentId: number,
436:   fileId: number,
437:   remotePath: string,
438:   filename: string,
439:   shortName: string | null,
440:   size: number,
441:   mimeType: string,
442:   torrentHash: string | null,
443:   tmdbId: number | null,
444:   rawTitle: string | null,
445:   rawYear: string | null,
446:   mediaType: "movie" | "tv" | "other" = "other",
447:   showTitle: string | null = null,
448:   seasonNumber: number | null = null,
449:   episodeNumber: number | null = null,
450:   episodeEndNumber: number | null = null,
451:   parsedYear: string | null = null
452: ) {
453:   if (!db) return;
454:   try {
455:     db.query(
456:       `INSERT INTO remote_list_cache
457:          (account_id, torrent_id, file_id, remote_path, filename, short_name, size, mime_type, torrent_hash, tmdb_id, raw_title, raw_year, media_type, show_title, season_number, episode_number, episode_end_number, parsed_year, synced_at)
458:        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
459:        ON CONFLICT(account_id, torrent_id, file_id) DO UPDATE SET
460:          remote_path        = excluded.remote_path,
461:          filename           = excluded.filename,
462:          short_name         = excluded.short_name,
463:          size               = excluded.size,
464:          mime_type          = excluded.mime_type,
465:          torrent_hash       = excluded.torrent_hash,
466:          tmdb_id            = excluded.tmdb_id,
467:          raw_title          = excluded.raw_title,
468:          raw_year           = excluded.raw_year,
469:          media_type         = excluded.media_type,
470:          show_title         = excluded.show_title,
471:          season_number      = excluded.season_number,
472:          episode_number     = excluded.episode_number,
473:          episode_end_number = excluded.episode_end_number,
474:          parsed_year        = excluded.parsed_year,
475:          synced_at          = CURRENT_TIMESTAMP`
476:     ).run(
477:       accountId,
478:       torrentId,
479:       fileId,
480:       remotePath,
481:       filename,
482:       shortName,
483:       size,
484:       mimeType,
485:       torrentHash,
486:       tmdbId,
487:       rawTitle,
488:       rawYear,
489:       mediaType,
490:       showTitle,
491:       seasonNumber,
492:       episodeNumber,
493:       episodeEndNumber,
494:       parsedYear
495:     );
496:   } catch (e) {
497:     console.error("upsertRemoteFile error:", e);
498:   }
499: }
500: 
501: export function getFilesForAccount(accountId: number) {
502:   if (!db) return [];
503:   try {
504:     return db
505:       .query(
506:         `SELECT
507:            r.id,
508:            r.account_id,
509:            r.torrent_id,
510:            r.file_id,
511:            r.remote_path,
512:            r.filename,
513:            r.short_name,
514:            r.size,
515:            r.mime_type,
516:            r.tmdb_id,
517:            r.raw_title,
518:            r.raw_year,
519:            r.media_type,
520:            r.show_title,
521:            r.season_number,
522:            r.episode_number,
523:            r.synced_at,
524:            m.title       AS media_title,
525:            m.year        AS media_year,
526:            m.poster_url  AS media_poster_url
527:          FROM remote_list_cache r
528:          LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
529:          WHERE r.account_id = ?
530:          ORDER BY COALESCE(m.title, r.show_title, r.raw_title, r.filename) ASC`
531:       )
532:       .all(accountId) as any[];
533:   } catch (e) {
534:     console.error("getFilesForAccount error:", e);
535:     return [];
536:   }
537: }
538: 
539: export function getMoviesForAccount(accountId: number) {
540:   if (!db) return [];
541:   try {
542:     return db
543:       .query(
544:         `SELECT
545:            r.id,
546:            r.account_id,
547:            r.torrent_id,
548:            r.file_id,
549:            r.remote_path,
550:            r.filename,
551:            r.short_name,
552:            r.size,
553:            r.mime_type,
554:            r.tmdb_id,
555:            r.raw_title,
556:            r.raw_year,
557:            r.parsed_year,
558:            r.synced_at,
559:            m.title        AS media_title,
560:            m.year         AS media_year,
561:            m.poster_url   AS media_poster_url,
562:            m.backdrop_url AS media_backdrop_url,
563:            m.overview     AS media_overview
564:          FROM remote_list_cache r
565:          LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
566:          WHERE r.account_id = ? AND r.media_type = 'movie'
567:          ORDER BY COALESCE(m.title, r.raw_title, r.filename) ASC`
568:       )
569:       .all(accountId) as any[];
570:   } catch (e) {
571:     console.error("getMoviesForAccount error:", e);
572:     return [];
573:   }
574: }
575: 
576: export function getTvShowsForAccount(accountId: number) {
577:   if (!db) return [];
578:   try {
579:     return db
580:       .query(
581:         `SELECT
582:            COALESCE(r.show_title, m.title, r.raw_title) AS show_title,
583:            m.tmdb_id,
584:            m.poster_url,
585:            m.backdrop_url,
586:            m.overview,
587:            COUNT(DISTINCT r.season_number) AS season_count,
588:            COUNT(r.id) AS episode_count,
589:            MIN(r.parsed_year) AS start_year
590:          FROM remote_list_cache r
591:          LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
592:          WHERE r.account_id = ? AND r.media_type = 'tv'
593:          GROUP BY COALESCE(r.show_title, m.title, r.raw_title)
594:          ORDER BY show_title ASC`
595:       )
596:       .all(accountId) as any[];
597:   } catch (e) {
598:     console.error("getTvShowsForAccount error:", e);
599:     return [];
600:   }
601: }
602: 
603: export function getTvShowDetailsForAccount(accountId: number, showTitle: string) {
604:   if (!db) return null;
605:   try {
606:     const episodes = db
607:       .query(
608:         `SELECT
609:            r.id,
610:            r.account_id,
611:            r.torrent_id,
612:            r.file_id,
613:            r.remote_path,
614:            r.filename,
615:            r.short_name,
616:            r.size,
617:            r.mime_type,
618:            r.tmdb_id,
619:            r.show_title,
620:            r.season_number,
621:            r.episode_number,
622:            r.episode_end_number,
623:            r.parsed_year,
624:            r.synced_at,
625:            m.title        AS show_name,
626:            m.poster_url   AS show_poster_url,
627:            m.backdrop_url AS show_backdrop_url,
628:            m.overview     AS show_overview,
629:            e.episode_title,
630:            e.overview     AS episode_overview,
631:            e.still_url    AS episode_still_url
632:          FROM remote_list_cache r
633:          LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
634:          LEFT JOIN tv_episodes e ON (r.tmdb_id = e.show_tmdb_id AND r.season_number = e.season_number AND r.episode_number = e.episode_number)
635:          WHERE r.account_id = ? AND r.media_type = 'tv' AND LOWER(r.show_title) = LOWER(?)
636:          ORDER BY r.season_number ASC, r.episode_number ASC`
637:       )
638:       .all(accountId, showTitle) as any[];
639: 
640:     return episodes;
641:   } catch (e) {
642:     console.error("getTvShowDetailsForAccount error:", e);
643:     return null;
644:   }
645: }
646: 
647: export function getOtherFilesForAccount(accountId: number) {
648:   if (!db) return [];
649:   try {
650:     return db
651:       .query(
652:         `SELECT
653:            r.id,
654:            r.account_id,
655:            r.torrent_id,
656:            r.file_id,
657:            r.remote_path,
658:            r.filename,
659:            r.short_name,
660:            r.size,
661:            r.mime_type,
662:            r.synced_at
663:          FROM remote_list_cache r
664:          WHERE r.account_id = ? AND (r.media_type = 'other' OR r.media_type IS NULL)
665:          ORDER BY r.filename ASC`
666:       )
667:       .all(accountId) as any[];
668:   } catch (e) {
669:     console.error("getOtherFilesForAccount error:", e);
670:     return [];
671:   }
672: }
673: 
674: export function clearRemoteFilesForAccount(accountId: number) {
675:   if (!db) return;
676:   try {
677:     db.query("DELETE FROM remote_list_cache WHERE account_id = ?").run(accountId);
678:   } catch (e) {
679:     console.error("clearRemoteFilesForAccount error:", e);
680:   }
681: }
682: 
683: // ── User-level queries (merge all accounts) ────────────────────────────────────
684: 
685: export function getMoviesForUser(userId: number) {
686:   if (!db) return [];
687:   try {
688:     return db
689:       .query(
690:         `SELECT
691:            r.id,
692:            r.account_id,
693:            r.torrent_id,
694:            r.file_id,
695:            r.remote_path,
696:            r.filename,
697:            r.short_name,
698:            r.size,
699:            r.mime_type,
700:            r.tmdb_id,
701:            r.raw_title,
702:            r.raw_year,
703:            r.parsed_year,
704:            r.synced_at,
705:            m.title        AS media_title,
706:            m.year         AS media_year,
707:            m.poster_url   AS media_poster_url,
708:            m.backdrop_url AS media_backdrop_url,
709:            m.overview     AS media_overview
710:          FROM remote_list_cache r
711:          JOIN user_accounts ua ON r.account_id = ua.account_id
712:          LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
713:          WHERE ua.user_id = ? AND r.media_type = 'movie'
714:          ORDER BY COALESCE(m.title, r.raw_title, r.filename) ASC`
715:       )
716:       .all(userId) as any[];
717:   } catch (e) {
718:     console.error("getMoviesForUser error:", e);
719:     return [];
720:   }
721: }
722: 
723: export function getTvShowsForUser(userId: number) {
724:   if (!db) return [];
725:   try {
726:     return db
727:       .query(
728:         `SELECT
729:            COALESCE(m.title, r.show_title, r.raw_title) AS show_title,
730:            m.tmdb_id,
731:            m.poster_url,
732:            m.backdrop_url,
733:            m.overview,
734:            COUNT(DISTINCT r.season_number) AS season_count,
735:            COUNT(r.id) AS episode_count,
736:            MIN(r.parsed_year) AS start_year
737:          FROM remote_list_cache r
738:          JOIN user_accounts ua ON r.account_id = ua.account_id
739:          LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
740:          WHERE ua.user_id = ? AND r.media_type = 'tv'
741:          GROUP BY COALESCE(m.title, r.show_title, r.raw_title) COLLATE NOCASE
742:          ORDER BY show_title COLLATE NOCASE ASC`
743:       )
744:       .all(userId) as any[];
745:   } catch (e) {
746:     console.error("getTvShowsForUser error:", e);
747:     return [];
748:   }
749: }
750: 
751: export function getTvShowDetailsForUser(userId: number, showTitle: string) {
752:   if (!db) return null;
753:   try {
754:     const episodes = db
755:       .query(
756:         `SELECT
757:            r.id,
758:            r.account_id,
759:            r.torrent_id,
760:            r.file_id,
761:            r.remote_path,
762:            r.filename,
763:            r.short_name,
764:            r.size,
765:            r.mime_type,
766:            r.tmdb_id,
767:            r.show_title,
768:            r.season_number,
769:            r.episode_number,
770:            r.episode_end_number,
771:            r.parsed_year,
772:            r.synced_at,
773:            m.title        AS show_name,
774:            m.poster_url   AS show_poster_url,
775:            m.backdrop_url AS show_backdrop_url,
776:            m.overview     AS show_overview,
777:            e.episode_title,
778:            e.overview     AS episode_overview,
779:            e.still_url    AS episode_still_url
780:          FROM remote_list_cache r
781:          JOIN user_accounts ua ON r.account_id = ua.account_id
782:          LEFT JOIN media m ON r.tmdb_id = m.tmdb_id
783:          LEFT JOIN tv_episodes e ON (r.tmdb_id = e.show_tmdb_id AND r.season_number = e.season_number AND r.episode_number = e.episode_number)
784:          WHERE ua.user_id = ? AND r.media_type = 'tv' AND LOWER(r.show_title) = LOWER(?)
785:          ORDER BY r.season_number ASC, r.episode_number ASC`
786:       )
787:       .all(userId, showTitle) as any[];
788: 
789:     return episodes;
790:   } catch (e) {
791:     console.error("getTvShowDetailsForUser error:", e);
792:     return null;
793:   }
794: }
795: 
796: export function getOtherFilesForUser(userId: number) {
797:   if (!db) return [];
798:   try {
799:     return db
800:       .query(
801:         `SELECT
802:            r.id,
803:            r.account_id,
804:            r.torrent_id,
805:            r.file_id,
806:            r.remote_path,
807:            r.filename,
808:            r.short_name,
809:            r.size,
810:            r.mime_type,
811:            r.synced_at
812:          FROM remote_list_cache r
813:          JOIN user_accounts ua ON r.account_id = ua.account_id
814:          WHERE ua.user_id = ? AND (r.media_type = 'other' OR r.media_type IS NULL)
815:          ORDER BY r.filename ASC`
816:       )
817:       .all(userId) as any[];
818:   } catch (e) {
819:     console.error("getOtherFilesForUser error:", e);
820:     return [];
821:   }
822: }
823: 
824: export function deleteAccount(userId: number, accountId: number): boolean {
825:   if (!db) return false;
826:   try {
827:     const link = db.query("SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?").get(userId, accountId);
828:     if (!link) return false;
829: 
830:     db.query("DELETE FROM user_accounts WHERE user_id = ? AND account_id = ?").run(userId, accountId);
831: 
832:     const otherLinks = db.query("SELECT 1 FROM user_accounts WHERE account_id = ? LIMIT 1").get(accountId);
833:     if (!otherLinks) {
834:       db.query("DELETE FROM remote_list_cache WHERE account_id = ?").run(accountId);
835:       db.query("DELETE FROM accounts WHERE id = ?").run(accountId);
836:     }
837: 
838:     return true;
839:   } catch (e) {
840:     console.error("deleteAccount error:", e);
841:     return false;
842:   }
843: }
844: 
845: // ── legacy metadata_cache ──────────────────────────────────────────────────────
846: 
847: export function getMetadata(filename: string) {
848:   if (!db) return null;
849:   try {
850:     return db.query("SELECT * FROM metadata_cache WHERE filename = ?").get(filename) as any;
851:   } catch (error) {
852:     console.error("Failed to get metadata:", error);
853:     return null;
854:   }
855: }
856: 
857: export function setMetadata(filename: string, title: string, year: string, posterUrl: string) {
858:   if (!db) return;
859:   try {
860:     db.query(
861:       `INSERT OR REPLACE INTO metadata_cache (filename, title, year, poster_url, updated_at)
862:        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
863:     ).run(filename, title, year, posterUrl);
864:   } catch (error) {
865:     console.error("Failed to set metadata:", error);
866:   }
867: }

(End of file - total 867 lines)
</content>
```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 1.9s)

---

## User

in this project, when i add an account with ajaydl1@atomicmail.io
the show Dune Prophecy has a card in tv show tab, but when i click it, it does not show any shows, responses a 404 error, 

const rawEpisodes = getTvShowDetailsForUser(session.userId, showTitle);
    if (!rawEpisodes || rawEpisodes.length === 0) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }  

present in @app/api/sync/route.ts check .sqlite database in ./data/

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 3.2s)

_Thinking:_

The user is reporting a bug. When they add an account with ajaydl1@atomicmail.io, the show "Dune Prophecy" shows a card in the TV show tab, but when clicked, it returns a 404 error. The 404 comes from `getTvShowDetailsForUser` returning no episodes.

Let me investigate the database to understand the issue. I'm in plan mode, so I can only read/inspect.

Let me query the sqlite database to see what's in remote_list_cache, media, tv_episodes tables for this account.





**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT account_id, filename, short_name, media_type, tmdb_id, show_title, season_number, episode_number, episode_end_number, parsed_year FROM remote_list_cache WHERE LOWER(COALESCE(show_title, raw_title, filename)) LIKE '%prophecy%' OR LOWER(COALESCE(show_title, raw_title, filename)) LIKE '%dune%';\" 2>&1 | head -50"
}
```

**Output:**
```
1|Dune Prophecy S01E06 The High-Handed Enemy 2160p AMZN WEB-DL DDP5 1 Atmos H 265-Kitsune.mkv|Dune Prophecy S01E06 The High-Handed Enemy 2160p AMZN WEB-DL DDP5 1 Atmos H 265-Kitsune.mkv|tv|90228|Dune Prophecy|1|6||
1|Dune.2021.2160p.UHD.BluRay.x265.10bit.HDR.DTS-HD.MA.TrueHD.7.1.Atmos-SWTYBLZ.mkv|Dune.2021.2160p.UHD.BluRay.x265.10bit.HDR.DTS-HD.MA.TrueHD.7.1.Atmos-SWTYBLZ.mkv|movie|438631|||||2021

```

**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT id, torbox_email FROM accounts; SELECT * FROM user_accounts;\" 2>&1"
}
```

**Output:**
```
1|ajaydl1@atomicmail.io
2|1|1|2026-08-06 18:28:09
1|1|1|2026-08-06 18:29:52

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 4.6s)

_Thinking:_

So we found the issue. The `remote_list_cache` has a row with `show_title = 'Dune Prophecy'`, but `tmdb_id = 90228`. Let me check if the media table has tmdb_id 90228 and if there are episode rows.

**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT * FROM media WHERE tmdb_id = 90228 OR title LIKE '%Dune%' OR title LIKE '%Prophecy%';\" 2>&1"
}
```

**Output:**
```
90228|Dune: Prophecy|2024|https://image.tmdb.org/t/p/w500/oWVohNsxkxA3u92EzRo8fTuXIS0.jpg|https://image.tmdb.org/t/p/w1280/lBoHzOgft2QfpjkVVvZCqeM4ttT.jpg|Ten thousand years before the ascension of Paul Atreides, sisters Valya and Tula Harkonnen establish the fabled sect and female order that would become known as the Bene Gesserit to control the future of humankind.|tv|2026-08-06 18:30:32
438631|Dune|2021|https://image.tmdb.org/t/p/w500/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg|https://image.tmdb.org/t/p/w1280/qVgZu5BTx6pu4owCvVOm4zjTfOi.jpg|Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people. As malevolent forces explode into conflict over the planet's exclusive supply of the most precious resource in existence - a commodity capable of unlocking humanity's greatest potential - only those who can conquer their fear will survive.|movie|2026-08-06 18:32:20

```

**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT * FROM tv_episodes WHERE show_tmdb_id = 90228;\" 2>&1 | head -30"
}
```

**Output:**
```
1|90228|1|1|The Hidden Hand|On Wallach IX, young Valya Harkonnen promises Mother Superior Raquella that she'll protect the Sisterhood by putting one of their own on the Imperial Throne. Thirty years later, Valya faces a threat to her long-awaited plan.|https://image.tmdb.org/t/p/w500/tIOtr2QGGi1Ktek3vQaU8VaNAmt.jpg|2026-08-06 18:17:40
2|90228|1|2|Two Wolves|After receiving word about events on Salusa Secundus, Valya brings Theodosia to the Imperial House to help manage the situation. Meanwhile, a reluctant Tula enlists Lila for a vital mission.|https://image.tmdb.org/t/p/w500/iqLJi0tYVwUjRJhvLcRpkG1ttII.jpg|2026-08-06 18:17:40
3|90228|1|3|Sisterhood Above All|Following a tragedy, young Tula worries about being accepted despite her family name, while a skeptical Valya struggles with the decision to take the Sisterhood vow. Years later, Valya receives a message that confirms her suspicions.|https://image.tmdb.org/t/p/w500/qRscPri7qXpVTwVQ4IJOVDpGrIw.jpg|2026-08-06 18:17:40
4|90228|1|4|Twice Born|As Tula attempts to understand the acolytes' shared dream, Valya sets her plan in motion to redeem House Harkonnen ahead of the Landsraad.|https://image.tmdb.org/t/p/w500/mMcYRktxx1S0Co8LxXooDwNTrmZ.jpg|2026-08-06 18:17:40
5|90228|1|5|In Blood, Truth|While Tula tries to keep her secret project from being discovered by the other Sisters, Desmond goes on a warpath to root out insurgents.|https://image.tmdb.org/t/p/w500/73K29n8q1EEjPSz2QfXu1wYwiwP.jpg|2026-08-06 18:17:40
6|90228|1|6|The High-Handed Enemy|As Tula contends with his true identity, Valya's maneuvering leads her into an epic confrontation with an increasingly powerful Desmond.|https://image.tmdb.org/t/p/w500/fwHiXMFdPU448Sy0mwckqurYXgz.jpg|2026-08-06 18:17:40

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 5.8s)

_Thinking:_

So media and tv_episodes look fine. Let me look at the API route that returns show details, to understand the 404. The user mentioned the code:

```
const rawEpisodes = getTvShowDetailsForUser(session.userId, showTitle);
    if (!rawEpisodes || rawEpisodes.length === 0) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }  
```

Let me find that route and identify it. Also, let me test the actual query `getTvShowDetailsForUser` with the show title. The card shows "Dune: Prophecy" probably (media.title is "Dune: Prophecy"). But the card in the TV tab — the query uses `COALESCE(m.title, r.show_title, r.raw_title)`. So the show_title in the card might be "Dune: Prophecy" (from media.title). When clicked, it passes showTitle = "Dune: Prophecy", but getTvShowDetailsForUser filters by `LOWER(r.show_title) = LOWER(?)` — and r.show_title is "Dune Prophecy" (no colon). So the match fails!

That's the bug. The detail query matches on `r.show_title` (the raw parsed title "Dune Prophecy") while the card title comes from `m.title` ("Dune: Prophecy").

Let me confirm by finding the API route.

**Tool: grep**

**Input:**
```json
{
  "pattern": "Show not found|getTvShowDetailsForUser"
}
```

**Output:**
```
Found 6 matches
/home/kshiyo/servers/webdoma/app/api/library/tv/[showTitle]/route.ts:
  Line 3: import { getTvShowDetailsForUser } from "@/lib/db";

  Line 21:     const rawEpisodes = getTvShowDetailsForUser(session.userId, showTitle);

  Line 23:       return NextResponse.json({ error: "Show not found" }, { status: 404 });


/home/kshiyo/servers/webdoma/lib/db.ts:
  Line 751: export function getTvShowDetailsForUser(userId: number, showTitle: string) {

  Line 791:     console.error("getTvShowDetailsForUser error:", e);


/home/kshiyo/servers/webdoma/components/tv-show-detail.tsx:
  Line 208:           <p className="text-lg font-medium">{error || "Show not found"}</p>

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 2.8s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/kshiyo/servers/webdoma/app/api/library/tv/[showTitle]/route.ts"
}
```

**Output:**
```
<path>/home/kshiyo/servers/webdoma/app/api/library/tv/[showTitle]/route.ts</path>
<type>file</type>
<content>
1: import { NextResponse } from "next/server";
2: import { getSession } from "@/lib/session";
3: import { getTvShowDetailsForUser } from "@/lib/db";
4: import { formatBytes } from "@/lib/utils";
5: 
6: export const dynamic = "force-dynamic";
7: 
8: export async function GET(
9:   request: Request,
10:   { params }: { params: Promise<{ showTitle: string }> }
11: ) {
12:   try {
13:     const session = await getSession();
14:     if (!session.userId) {
15:       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
16:     }
17: 
18:     const { showTitle: rawShowTitle } = await params;
19:     const showTitle = decodeURIComponent(rawShowTitle);
20: 
21:     const rawEpisodes = getTvShowDetailsForUser(session.userId, showTitle);
22:     if (!rawEpisodes || rawEpisodes.length === 0) {
23:       return NextResponse.json({ error: "Show not found" }, { status: 404 });
24:     }
25: 
26:     const first = rawEpisodes[0];
27:     const showInfo = {
28:       showTitle: first.show_title || first.show_name || showTitle,
29:       posterUrl: first.show_poster_url,
30:       backdropUrl: first.show_backdrop_url,
31:       overview: first.show_overview,
32:       tmdbId: first.tmdb_id,
33:     };
34: 
35:     // Group episodes by season
36:     const seasonsMap = new Map<number, any[]>();
37:     for (const row of rawEpisodes) {
38:       const sNum = row.season_number ?? 1;
39:       if (!seasonsMap.has(sNum)) {
40:         seasonsMap.set(sNum, []);
41:       }
42:       seasonsMap.get(sNum)!.push({
43:         id: row.id,
44:         account_id: row.account_id,
45:         torrent_id: row.torrent_id,
46:         file_id: row.file_id,
47:         remote_path: row.remote_path,
48:         filename: row.filename,
49:         short_name: row.short_name,
50:         size: row.size,
51:         sizeFormatted: formatBytes(row.size || 0),
52:         mime_type: row.mime_type,
53:         season_number: sNum,
54:         episode_number: row.episode_number,
55:         episode_end_number: row.episode_end_number,
56:         episode_title: row.episode_title || `Episode ${row.episode_number ?? 1}`,
57:         episode_overview: row.episode_overview,
58:         still_url: row.episode_still_url,
59:       });
60:     }
61: 
62:     const seasons = Array.from(seasonsMap.entries()).map(([seasonNumber, episodes]) => ({
63:       seasonNumber,
64:       episodes,
65:     }));
66: 
67:     return NextResponse.json({
68:       show: showInfo,
69:       seasons,
70:     });
71:   } catch (error) {
72:     console.error("TV Show Detail API error:", error);
73:     return NextResponse.json({ error: "Failed to fetch TV show detail" }, { status: 500 });
74:   }
75: }

(End of file - total 75 lines)
</content>
```

**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT DISTINCT COALESCE(m.title, r.show_title, r.raw_title) AS show_title FROM remote_list_cache r LEFT JOIN media m ON r.tmdb_id = m.tmdb_id WHERE r.account_id = 1 AND r.media_type='tv';\" 2>&1"
}
```

**Output:**
```
House of the Dragon
Dune: Prophecy

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 5.4s)

_Thinking:_

Now I found the bug. Let me confirm cardinality.

The TV tab lists shows with `COALESCE(m.title, r.show_title, r.raw_title)` = "Dune: Prophecy" (because media.title is "Dune: Prophecy"). Clicking passes showTitle = "Dune: Prophecy" (URL-decoded).

`getTvShowDetailsForUser` filters `LOWER(r.show_title) = LOWER(?)` → `LOWER(Dune Prophecy) = LOWER(Dune: Prophecy)` → false. So no rows => 404.

Also `getTvShowsForUser` groups by `COALESCE(m.title, r.show_title, r.raw_title)`. For House of the Dragon, media title probably matches r.show_title, so it works. But for Dune Prophecy, the parsed title is "Dune Prophecy" while the media (TMDB) title is "Dune: Prophecy" — a mismatch.

The same bug exists in `getTvShowsForAccount`/`getTvShowDetailsForAccount` and `getTvShowsForUser`/`getTvShowDetailsForUser`.

Also note episode_count computation: for Dune Prophecy, count(r.id) = 1 (one file S01E06). And season_count = 1. But that's fine.

Let me verify House of the Dragon rows to confirm.





**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT show_title, m.title AS media_title, tmdb_id, season_number, episode_number FROM remote_list_cache r LEFT JOIN media m ON r.tmdb_id=m.tmdb_id WHERE account_id=1 AND media_type='tv'; SELECT '---'; SELECT * FROM tv_episodes WHERE show_tmdb_id IN (SELECT tmdb_id FROM media WHERE title='House of the Dragon') LIMIT 2;\" 2>&1"
}
```

**Output:**
```
Parse error in 2nd command line argument: ambiguous column name: tmdb_id
  SELECT show_title, m.title AS media_title, tmdb_id, season_number, episode_num
                               error here ---^

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 3.7s)

**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT r.show_title, m.title AS media_title, r.tmdb_id, r.season_number, r.episode_number FROM remote_list_cache r LEFT JOIN media m ON r.tmdb_id=m.tmdb_id WHERE r.account_id=1 AND r.media_type='tv';\" 2>&1"
}
```

**Output:**
```
House Of The Dragon|House of the Dragon|94997|3|5
House of the Dragon|House of the Dragon|94997|3|7
Dune Prophecy|Dune: Prophecy|90228|1|6

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 5.9s)

_Thinking:_

Confirmed the bug clearly:

**Root cause:** The TV tab groups and displays show names using `COALESCE(m.title, r.show_title, ...)` — this prefers the TMDB title (e.g. "Dune: Prophecy"). But `getTvShowDetailsForUser` / `getTvShowDetailsForAccount` filter on `LOWER(r.show_title) = LOWER(?)` — the parsed filename title ("Dune Prophecy" without colon). So there's a mismatch when the parsed title differs from the TMDB title.

House of the Dragon works because the parser produced "House of the Dragon" (lowercase "of") vs media title "House of the Dragon" — wait actually first row has show_title "House Of The Dragon" (capital O). Let me check: filter uses LOWER(r.show_title) = LOWER(?). The card displays COALESCE(m.title,...) = "House of the Dragon". Row's show_title = "House Of The Dragon". LOWER gives "house of the dragon" == "house of the dragon" → matches. Good.

For Dune: parsed show_title = "Dune Prophecy", media title = "Dune: Prophecy". Displayed card "Dune: Prophecy". Detail filter: LOWER("Dune: Prophecy") != LOWER("Dune Prophecy") → 404.

**The fix options:**

1. Best fix: filter detail query by the display name consistently. Change `getTvShowDetailsForUser` and `getTvShowDetailsForAccount` to match against `COALESCE(m.title, r.show_title, r.raw_title)` instead of `r.show_title`. i.e.:
   ```sql
   WHERE ... AND LOWER(COALESCE(m.title, r.show_title, r.raw_title)) = LOWER(?)
   ```
   That matches what the tab shows.

2. Alternative: change tab query to use r.show_title for display. But that would show "Dune Prophecy" on card - the original file filename-based title; and also grouping could split shows with multiple naming variants. Actually grouping by COALESCE uses media title which is better for grouping. Prefer fix #1.

Also, there may be a related consistency issue in grouping: `getTvShowsForAccount` groups by `COALESCE(r.show_title, m.title, r.raw_title)` ordering (account-level), while `getTvShowsForUser` groups by `COALESCE(m.title, r.show_title, r.raw_title)`. Minor inconsistency but not the reported bug.

Let me also double check how the tv show tab builds the card link (what title is passed to the detail route).

**Tool: grep**

**Input:**
```json
{
  "pattern": "library/tv/|encodeURIComponent\\(show|router.push|href=",
  "include": "*.tsx"
}
```

**Output:**
```
Found 6 matches
/home/kshiyo/servers/webdoma/app/settings/page.tsx:
  Line 55:       router.push("/login");


/home/kshiyo/servers/webdoma/components/login-form.tsx:
  Line 83:         router.push("/");


/home/kshiyo/servers/webdoma/components/sidebar.tsx:
  Line 30:       router.push("/login");

  Line 110:                           href={item.href}


/home/kshiyo/servers/webdoma/components/account-switcher.tsx:
  Line 66:     router.push(`/?${params.toString()}`);


/home/kshiyo/servers/webdoma/components/tv-show-detail.tsx:
  Line 75:         const url = `/api/library/tv/${encodeURIComponent(showTitle)}`;

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 3.8s)

_Thinking:_

Let me check how the TV tab card is rendered — which title is used for the link. Let me look at the main page and tv tab component.

**Tool: grep**

**Input:**
```json
{
  "include": "*.tsx",
  "pattern": "show_title|setShowTitle|onSelect|TV shows|media_type.*tv",
  "path": "/home/kshiyo/servers/webdoma/components"
}
```

**Output:**
```
Found 14 matches
/home/kshiyo/servers/webdoma/components/file-browser.tsx:
  Line 135:             Add a TorBox account to start browsing your movies, TV shows, and files.

  Line 211:                 placeholder={`Search ${activeTab === "movies" ? "movies" : activeTab === "tv" ? "TV shows" : "files"}...`}

  Line 253:             onSelectShow={(title) => setSelectedShowTitle(title)}


/home/kshiyo/servers/webdoma/components/account-switcher.tsx:
  Line 159:               onSelect={() => handleSwitchAccount(account.id)}

  Line 195:             onSelect={() => setIsAddAccountOpen(true)}


/home/kshiyo/servers/webdoma/components/tv-shows-grid.tsx:
  Line 8:   show_title: string;

  Line 22:   onSelectShow: (showTitle: string) => void;

  Line 25: export function TvShowsGrid({ shows, isLoading, searchQuery, onSelectShow }: TvShowsGridProps) {

  Line 27:     s.show_title.toLowerCase().includes(searchQuery.toLowerCase())

  Line 44:         <p className="text-lg font-medium">No TV shows found</p>

  Line 54:           key={show.show_title}

  Line 55:           onClick={() => onSelectShow(show.show_title)}

  Line 64:                 alt={show.show_title}

  Line 92:               {show.show_title}

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 2.6s)

_Thinking:_

Confirmed. The card click passes `show.show_title` which is the `COALESCE(m.title, ...)` value = "Dune: Prophecy", but the detail query filters by `r.show_title` = "Dune Prophecy". Mismatch → 404.

Let me look at tv-shows-grid to double check the show_title from the API. And check the API that lists tv shows for user.

**Tool: bash**

**Input:**
```json
{
  "command": "sqlite3 ./data/metadata.sqlite \"SELECT COLSNOWORK;\" 2>&1; echo done"
}
```

**Output:**
```
Parse error in 2nd command line argument: no such column: COLSNOWORK
  SELECT COLSNOWORK;
         ^--- error here
done

```

**Tool: glob**

**Input:**
```json
{
  "pattern": "app/api/library/**/*.ts"
}
```

**Output:**
```
/home/kshiyo/servers/webdoma/app/api/library/tv/route.ts
/home/kshiyo/servers/webdoma/app/api/library/tv/[showTitle]/route.ts
/home/kshiyo/servers/webdoma/app/api/library/other/route.ts
/home/kshiyo/servers/webdoma/app/api/library/movies/route.ts
```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 3.2s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/kshiyo/servers/webdoma/app/api/library/tv/route.ts"
}
```

**Output:**
```
<path>/home/kshiyo/servers/webdoma/app/api/library/tv/route.ts</path>
<type>file</type>
<content>
1: import { NextResponse } from "next/server";
2: import { getSession } from "@/lib/session";
3: import { getTvShowsForUser } from "@/lib/db";
4: 
5: export const dynamic = "force-dynamic";
6: 
7: export async function GET() {
8:   try {
9:     const session = await getSession();
10:     if (!session.userId) {
11:       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
12:     }
13: 
14:     const rawShows = getTvShowsForUser(session.userId);
15: 
16:     const shows = rawShows.map((row) => ({
17:       show_title: row.show_title,
18:       tmdb_id: row.tmdb_id,
19:       poster_url: row.poster_url,
20:       backdrop_url: row.backdrop_url,
21:       overview: row.overview,
22:       season_count: row.season_count,
23:       episode_count: row.episode_count,
24:       start_year: row.start_year,
25:     }));
26: 
27:     return NextResponse.json({ shows });
28:   } catch (error) {
29:     console.error("TV Shows API error:", error);
30:     return NextResponse.json({ error: "Failed to fetch TV shows" }, { status: 500 });
31:   }
32: }

(End of file - total 32 lines)
</content>
```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 5.8s)

_Thinking:_

The full picture is confirmed:

1. TV tab: `getTvShowsForUser` returns `show_title = COALESCE(m.title, r.show_title, r.raw_title)` = "Dune: Prophecy" (TMDB title with colon).
2. Card click → `/api/library/tv/Dune%3A%20Prophecy` → showTitle = "Dune: Prophecy".
3. `getTvShowDetailsForUser` filters `LOWER(r.show_title) = LOWER(?)` → "dune prophecy" ≠ "dune: prophecy" → 0 rows → 404.

Root cause: mismatch between the title used for the card (media title) and the title used to filter details (raw parsed `show_title`).

Fix plan:
- Update `getTvShowDetailsForUser` (lib/db.ts:751) SQL to filter by `LOWER(COALESCE(m.title, r.show_title, r.raw_title)) = LOWER(?)` to match the display name.
- Same for `getTvShowDetailsForAccount` (lib/db.ts:603) for the account-level variant (used by account view, likely in file-browser for account switch).
- Optionally also align grouping/ordering inconsistencies (getTvShowsForAccount uses COALESCE(r.show_title, m.title, r.raw_title) while user uses COALESCE(m.title, ...)) — for consistency, also apply the same fix to the account-level list query so cards match details.

Optionally a more robust fix: pass tmdb_id instead of title in URL. But minimal fix is the SQL change.

Let me check if there's an account-level tv detail route too.

**Tool: grep**

**Input:**
```json
{
  "pattern": "getTvShowsForAccount|getTvShowDetailsForAccount"
}
```

**Output:**
```
Found 4 matches
/home/kshiyo/servers/webdoma/lib/db.ts:
  Line 576: export function getTvShowsForAccount(accountId: number) {

  Line 598:     console.error("getTvShowsForAccount error:", e);

  Line 603: export function getTvShowDetailsForAccount(accountId: number, showTitle: string) {

  Line 642:     console.error("getTvShowDetailsForAccount error:", e);

```

---

## Assistant (Plan · DeepSeek V4 Flash Free (New) · 9.1s)

_Thinking:_

The account-level functions are not used by any route (only the user-level ones are used). Let me verify quickly whether they're referenced anywhere else... The grep only found db.ts references. So only `getTvShowsForUser` / `getTvShowDetailsForUser` are in use.

Now I have a complete picture. Let me present the plan.

Root cause:
- Card title comes from media table: "Dune: Prophecy" (TMDB title, has colon).
- Detail lookup filters on `r.show_title` (parsed from filename): "Dune Prophecy" (no colon).
- `LOWER("Dune: Prophecy") != LOWER("Dune Prophecy")` → no rows → 404.
- House of the Dragon worked because both were equal after lowercasing.

Fix: change the WHERE clause in `getTvShowDetailsForUser` (lib/db.ts:784) from `LOWER(r.show_title) = LOWER(?)` to `LOWER(COALESCE(m.title, r.show_title, r.raw_title)) = LOWER(?)`.

Also apply the same fix to the account-level `getTvShowDetailsForAccount` for consistency (and align `getTvShowsForAccount`'s COALESCE ordering with the user-level one for consistency).

I'm in plan mode. Present the plan concisely.

## Root cause found

The card in the TV tab and the detail API look up shows by *different titles*:

**Tab list** (`lib/db.ts:728` — `getTvShowsForUser`) returns the card name as `COALESCE(m.title, r.show_title, r.raw_title)` → the **TMDB title** `"Dune: Prophecy"` (with colon).

**Detail lookup** (`lib/db.ts:784` — `getTvShowDetailsForUser`) filters with `WHERE ... LOWER(r.show_title) = LOWER(?)` → the **filename-parsed title** `"Dune Prophecy"` (no colon, since the filename is `Dune Prophecy S01E06 ... .mkv`).

`LOWER('Dune: Prophecy') != LOWER('Dune Prophecy')` → 0 rows → the 404 in `app/api/library/tv/[showTitle]/route.ts:22`.

Verified in `data/metadata.sqlite`: card shows "Dune: Prophecy", `remote_list_cache.show_title` = "Dune Prophecy". "House of the Dragon" works only because its parsed and TMDB titles happen to lowercase identically.

## Plan

1. **`lib/db.ts:784`** — `getTvShowDetailsForUser`: change the WHERE clause to match on the same title the card uses:
   `LOWER(COALESCE(m.title, r.show_title, r.raw_title)) = LOWER(?)`
2. **`lib/db.ts:635`** — `getTvShowDetailsForAccount`: apply the same fix (account-scoped variant, keeps both consistent).
3. **`lib/db.ts:593`** — `getTvShowsForAccount`: align its `COALESCE(r.show_title, m.title, r.raw_title)` ordering with the user-level query (`COALESCE(m.title, r.show_title, r.raw_title)`) so account-level grouping matches too.
4. **Verify**: run `bun --bun run lint`, then re-test clicking the "Dune: Prophecy" card (re-sync not needed; existing data suffices).

This fixes it without touching stored data. Want me to also harden the URL to use `tmdb_id` instead of the title (more robust against any rename), or is the SQL fix enough?

---

