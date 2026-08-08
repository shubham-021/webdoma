import {
  TORBOX_ENDPOINTS,
  getTbSbAnonKey,
  TOKEN_REFRESH_BUFFER_S,
} from "./torbox-config";
import { decrypt, encrypt } from "./crypto";
import {
  getAccountById,
  updateAccountTokens,
} from "./db";

// Types

export interface TorBoxAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
}

export interface TorBoxFile {
  id: number;
  md5: string | null;
  hash: string;
  name: string;
  size: number;
  zipped: boolean;
  s3_path: string;
  infected: boolean;
  mimetype: string;
  short_name: string;
  absolute_path: string;
  opensubtitles_hash: string;
}

export interface TorBoxTorrent {
  id: number;
  hash: string;
  name: string;
  size: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  download_state: string;
  progress: number;
  files: TorBoxFile[];
  [key: string]: unknown;
}

export interface TorBoxListResponse {
  success: boolean;
  error: string | null;
  detail: string;
  data: TorBoxTorrent[];
}

export interface TorBoxCdnResponse {
  success: boolean;
  error: string | null;
  detail: string;
  data: string; // CDN URL
}

// Retry Helper

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : undefined;

    if (status === 429 && retries > 0) {
      console.warn(
        `TorBox API 429 rate limit. Retrying in ${delay}ms... (${retries} left)`
      );
      const jitter = Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Authentication 

// Authenticate with TorBox using email and password.
export async function authenticateTorBox(
  email: string,
  password: string
): Promise<TorBoxAuthResponse> {
  const anonKey = getTbSbAnonKey();

  const res = await fetch(TORBOX_ENDPOINTS.AUTH_LOGIN, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error_description?: string }).error_description ||
      (body as { msg?: string }).msg ||
      `Authentication failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

// Refresh an expired access token using a refresh token.
export async function refreshTorBoxToken(
  refreshToken: string
): Promise<TorBoxAuthResponse> {
  const anonKey = getTbSbAnonKey();

  const res = await fetch(TORBOX_ENDPOINTS.AUTH_REFRESH, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error_description?: string }).error_description ||
      `Token refresh failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

// Token Management 

/**
 * Get a valid access token for the given account.
 *
 * Strategy:
 *   1. Read stored token from DB
 *   2. If token is still valid (with buffer) → return it
 *   3. If expired → try refresh token
 *   4. If refresh fails → re-authenticate with stored credentials
 *   5. Update DB with new tokens in all cases
 */
export async function getValidAccessToken(accountId: number): Promise<string> {
  const account = getAccountById(accountId);
  if (!account) {
    throw new Error("Account not found");
  }

  const now = Math.floor(Date.now() / 1000);

  // Check if current token is still valid (with buffer)
  if (
    account.access_token &&
    account.token_expires_at &&
    now + TOKEN_REFRESH_BUFFER_S < account.token_expires_at
  ) {
    return account.access_token;
  }

  // Token expired or about to expire — try refresh
  if (account.refresh_token) {
    try {
      const refreshed = await refreshTorBoxToken(account.refresh_token);
      updateAccountTokens(
        accountId,
        refreshed.access_token,
        refreshed.refresh_token,
        refreshed.expires_at
      );
      return refreshed.access_token;
    } catch (e) {
      console.warn(
        `Token refresh failed for account ${accountId}, falling back to re-auth:`,
        e
      );
    }
  }

  // Refresh failed or no refresh token — re-authenticate
  let password: string;
  try {
    password = decrypt(account.torbox_password);
  } catch {
    throw new Error("Failed to decrypt stored credentials");
  }

  const authResult = await authenticateTorBox(account.torbox_email, password);
  updateAccountTokens(
    accountId,
    authResult.access_token,
    authResult.refresh_token,
    authResult.expires_at
  );
  return authResult.access_token;
}

// Torrent Data 
export async function fetchTorrentList(
  accessToken: string
): Promise<TorBoxTorrent[]> {
  return withRetry(async () => {
    const res = await fetch(TORBOX_ENDPOINTS.TORRENTS_MYLIST, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = new Error(`Failed to fetch torrent list (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }

    const body: TorBoxListResponse = await res.json();

    if (!body.success) {
      throw new Error(body.error || "TorBox API returned unsuccessful response");
    }

    return body.data || [];
  });
}

// CDN Link Generation
export async function requestCdnLink(
  torrentId: number,
  fileId: number,
  accessToken: string
): Promise<string> {
  return withRetry(async () => {
    const url = new URL(TORBOX_ENDPOINTS.TORRENTS_REQUEST_DL);
    url.searchParams.set("torrent_id", String(torrentId));
    url.searchParams.set("file_id", String(fileId));
    url.searchParams.set("token", accessToken);

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      const err = new Error(`Failed to request CDN link (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }

    const body: TorBoxCdnResponse = await res.json();

    if (!body.success || !body.data) {
      throw new Error(body.error || "TorBox API returned no CDN URL");
    }

    return body.data;
  });
}

// Torrent Cache Check

export interface CachedTorrentFile {
  id: number;
  name: string;
  size: number;
  opensubtitles_hash: string | null;
  short_name: string;
  mimetype: string;
}

export interface CachedTorrentInfo {
  name: string;
  size: number;
  hash: string;
  files: CachedTorrentFile[];
}

export interface CheckCachedResponse {
  success: boolean;
  error: string | null;
  detail: string;
  data: Record<string, CachedTorrentInfo>;
}

/** Check if a single torrent hash is cached on TorBox. */
export async function checkTorrentCached(
  hash: string,
  accessToken: string
): Promise<CheckCachedResponse> {
  return withRetry(async () => {
    const url = new URL(TORBOX_ENDPOINTS.TORRENTS_CHECK_CACHED);
    url.searchParams.set("hash", hash);
    url.searchParams.set("format", "object");
    url.searchParams.set("list_files", "true");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = new Error(`Failed to check torrent cache (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }

    return res.json();
  });
}

/** Check if multiple torrent hashes are cached on TorBox (bulk). */
export async function checkTorrentsCachedBulk(
  hashes: string[],
  accessToken: string
): Promise<CheckCachedResponse> {
  return withRetry(async () => {
    const url = new URL(TORBOX_ENDPOINTS.TORRENTS_CHECK_CACHED);
    url.searchParams.set("format", "object");
    url.searchParams.set("list_files", "true");

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hashes }),
    });

    if (!res.ok) {
      const err = new Error(`Failed to check torrent cache (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }

    return res.json();
  });
}

// Torrent Creation

export interface CreateTorrentResponse {
  success: boolean;
  error: string | null;
  detail: string;
  data: {
    hash: string;
    torrent_id: number;
    auth_id: string;
  };
}

/** Add a torrent to TorBox account using a magnet link. */
export async function createTorrent(
  magnetLink: string,
  accessToken: string,
  addOnlyIfCached: boolean = true
): Promise<CreateTorrentResponse> {
  return withRetry(async () => {
    const formData = new FormData();
    formData.append("magnet", magnetLink);
    if (addOnlyIfCached) {
      formData.append("add_only_if_cached", "true");
    }

    const res = await fetch(TORBOX_ENDPOINTS.TORRENTS_CREATE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = new Error(`Failed to create torrent (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }

    return res.json();
  });
}

