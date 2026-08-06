// TorBox Endpoints

export const TORBOX_ENDPOINTS = {
  AUTH_LOGIN: "https://db.torbox.app/auth/v1/token?grant_type=password",
  AUTH_REFRESH: "https://db.torbox.app/auth/v1/token?grant_type=refresh_token",
  TORRENTS_MYLIST: "https://api.torbox.app/v1/api/torrents/mylist",
  TORRENTS_REQUEST_DL: "https://api.torbox.app/v1/api/torrents/requestdl",
  TORRENTS_CHECK_CACHED: "https://api.torbox.app/v1/api/torrents/checkcached",
  TORRENTS_CREATE: "https://api.torbox.app/v1/api/torrents/createtorrent",
} as const;

// Auth Config

/**
 * Returns the Supabase anon/public key required for all auth endpoints.
 * Stored in .env as TB_SB_ANON_KEY.
 */
export function getTbSbAnonKey(): string {
  const key = process.env.TB_SB_ANON_KEY;
  if (!key) {
    throw new Error("TB_SB_ANON_KEY environment variable is not set");
  }
  return key;
}

/**
 * How many seconds before actual token expiry to trigger a proactive refresh.
 * Prevents race conditions where a request fires with an about-to-expire token.
 */
export const TOKEN_REFRESH_BUFFER_S = 60;

/**
 * Minimum file size in bytes to include during sync.
 * Files smaller than this are skipped (typically non-media files).
 * Default: 250 MB
 */
export const MIN_FILE_SIZE_BYTES = 250 * 1024 * 1024;
