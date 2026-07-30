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
