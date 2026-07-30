import { createClient, type WebDAVClient } from "webdav";
import { getSession } from "./session";
import { WEBDAV_BASE_URL } from "./constants";

export function createWebDAVClient(
  username: string,
  password: string
): WebDAVClient {
  return createClient(WEBDAV_BASE_URL, {
    username,
    password,
  });
}

export async function getAuthenticatedClient(): Promise<WebDAVClient> {
  const session = await getSession();
  if (!session.username || !session.password) {
    throw new Error("Not authenticated");
  }
  return createWebDAVClient(session.username, session.password);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 4,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.status || error?.response?.status;
    if (status === 429 && retries > 0) {
      console.warn(
        `WebDAV 429 encountered. Retrying in ${delay}ms... (Retries left: ${retries})`
      );
      const jitter = Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
