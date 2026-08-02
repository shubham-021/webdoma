import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRcloneConfigName, isRcloneInstalled } from "@/lib/rclone";
import { serverCache } from "@/lib/server-cache";
import { formatBytes, getMimeType, getExtension, buildBreadcrumbs } from "@/lib/utils";
import type { FileItem, FilesResponse } from "@/lib/types";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
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

    const rcloneInstalled = await isRcloneInstalled();
    if (!rcloneInstalled) {
      return NextResponse.json(
        { error: "rclone is not installed on the server" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const path = "/"; // Force root path since we're flattening
    const refresh = searchParams.get("refresh") === "true";
    const configName = getRcloneConfigName(session.username);
    const cacheKey = `${session.username}:rclone_all_videos`;
    
    let items = (serverCache.get(cacheKey) as FileItem[]) || null;

    if (refresh || !items) {
      try {
        // Use rclone lsjson to get all video files > 500MB recursively
        const { stdout } = await execFileAsync("rclone", [
          "lsjson",
          `${configName}:/`,
          "-R",
          "--files-only",
          "--min-size", "500M",
          "--include", "*.{mp4,mkv,mov,avi,wmv,flv,webm,m4v,mpg,mpeg,ts,m2ts,vob,3gp,ogv}"
        ]);

        const rawItems = JSON.parse(stdout);
        
        items = rawItems.map((item: any) => {
          const filename = item.Name;
          const ext = getExtension(filename);
          const size = item.Size || 0;
          const sizeFormatted = formatBytes(size);
          // Rclone Path is relative to the queried root. For webdav download/stream APIs,
          // we need an absolute path with leading slash.
          const itemPath = item.Path.startsWith("/") ? item.Path : `/${item.Path}`;

          return {
            name: filename,
            path: itemPath,
            size,
            sizeFormatted,
            type: "file",
            mimeType: item.MimeType || getMimeType(filename),
            lastModified: item.ModTime || new Date().toISOString(),
            isVideo: true,
            isAudio: false,
            extension: ext,
          } satisfies FileItem;
        });

        // Sort by name
        if (items) {
          items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
          // Cache for 10 minutes
          serverCache.set(cacheKey, items, 10 * 60 * 1000);
        }
      } catch (execError: any) {
        console.error("rclone lsjson error:", execError);
        
        if (execError.stderr && execError.stderr.includes("429 Too Many Requests")) {
            return NextResponse.json(
                { error: "TorBox rate limit exceeded. Please wait a few minutes." },
                { status: 429 }
            );
        }
        throw execError;
      }
    }

    const response: FilesResponse = {
      items: items || [],
      currentPath: path,
      breadcrumbs: buildBreadcrumbs(path),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Files listing error:", error);
    return NextResponse.json(
      { error: "Failed to list files via rclone" },
      { status: 500 }
    );
  }
}
