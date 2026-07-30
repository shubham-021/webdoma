import { randomUUID } from "crypto";
import { TOKEN_TTL_MS } from "./constants";
import type { StreamToken } from "./types";

const tokenStore = new Map<string, StreamToken>();

export function createToken(
  filePath: string,
  username: string,
  password: string
): { token: string; expiresAt: number } {
  const token = randomUUID();
  const expiresAt = Date.now() + TOKEN_TTL_MS;

  tokenStore.set(token, {
    filePath,
    username,
    password,
    expiresAt,
  });

  cleanup();
  return { token, expiresAt };
}

export function validateToken(
  token: string,
  requestedPath: string
): StreamToken | null {
  const entry = tokenStore.get(token);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return null;
  }

  // Token authorizes the specific file path it was created for
  if (entry.filePath !== requestedPath) return null;

  return entry;
}

function cleanup() {
  const now = Date.now();
  for (const [key, value] of tokenStore) {
    if (now > value.expiresAt) {
      tokenStore.delete(key);
    }
  }
}
