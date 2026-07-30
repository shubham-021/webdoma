import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createWebDAVClient, withRetry } from "@/lib/webdav";
import { serverCache } from "@/lib/server-cache";
import { formatBytes, getMimeType, getFileType, getExtension, buildBreadcrumbs } from "@/lib/utils";
import { VIDEO_EXTENSIONS, AUDIO_EXTENSIONS } from "@/lib/constants";
import type { FileItem, FilesResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.username || !session.password) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path") || "/";
    const refresh = searchParams.get("refresh") === "true";

    const client = createWebDAVClient(session.username, session.password);

    const cacheKey = `${session.username}:${path}`;
    let contents: any = null;

    if (!refresh) {
      contents = serverCache.get(cacheKey);
    }

    if (!contents) {
      contents = await withRetry(() => client.getDirectoryContents(path));
      serverCache.set(cacheKey, contents, 5 * 60 * 1000); // 5 minutes TTL
    }

    // getDirectoryContents returns an array of FileStat objects
    // Filter out the current directory itself (WebDAV sometimes includes it)
    const rawItems = (Array.isArray(contents) ? contents : []).filter(
      (item: any) => {
        const itemPath = item.filename as string;
        // Skip the queried directory itself
        return itemPath !== path && itemPath !== path.replace(/\/$/, "");
      }
    );

    // Deduplicate by path
    const seen = new Set<string>();
    const uniqueItems = rawItems.filter((item: any) => {
      const p = item.filename as string;
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });

    // Map properties directly without scanning subdirectories
    const items: FileItem[] = uniqueItems.map((item: any) => {
      const filename = item.basename as string;
      const ext = getExtension(filename);
      const isDir = item.type === "directory";
      const size = (item.size as number) || 0;
      const sizeFormatted = isDir ? "--" : formatBytes(size);

      return {
        name: filename,
        path: item.filename as string,
        size,
        sizeFormatted,
        type: isDir ? "directory" : "file",
        mimeType: isDir ? "" : getMimeType(filename),
        lastModified: (item.lastmod as string) || new Date().toISOString(),
        isVideo: !isDir && VIDEO_EXTENSIONS.has(ext),
        isAudio: !isDir && AUDIO_EXTENSIONS.has(ext),
        extension: ext,
      } satisfies FileItem;
    });

    // Sort: directories first, then by name
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    const response: FilesResponse = {
      items,
      currentPath: path,
      breadcrumbs: buildBreadcrumbs(path),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Files listing error:", error);
    return NextResponse.json(
      { error: "Failed to list directory" },
      { status: 500 }
    );
  }
}
