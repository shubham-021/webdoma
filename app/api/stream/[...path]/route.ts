import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createWebDAVClient } from "@/lib/webdav";
import { validateToken } from "@/lib/tokens";
import { getMimeType } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Helper: convert Node.js Readable to Web ReadableStream
function nodeStreamToWeb(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) =>
        controller.enqueue(new Uint8Array(chunk))
      );
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err: Error) => controller.error(err));
    },
    cancel() {
      if ("destroy" in nodeStream && typeof nodeStream.destroy === "function") {
        nodeStream.destroy();
      }
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = "/" + path.map(decodeURIComponent).join("/");

  // Auth: try session cookie first, then token query param
  let username: string;
  let password: string;

  const tokenParam = request.nextUrl.searchParams.get("token");
  if (tokenParam) {
    const tokenData = validateToken(tokenParam, filePath);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    username = tokenData.username;
    password = tokenData.password;
  } else {
    const session = await getSession();
    if (!session.username || !session.password) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    username = session.username;
    password = session.password;
  }

  try {
    const client = createWebDAVClient(username, password);

    // Get file size for Content-Range
    const stat = await client.stat(filePath);
    const fileSize = ((stat as unknown) as Record<string, unknown>).size as number;
    const mimeType = getMimeType(filePath);

    // Parse Range header
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      const start = parseInt(match?.[1] || "0");
      const end = match?.[2] ? parseInt(match[2]) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = client.createReadStream(filePath, {
        range: { start, end },
      });

      const webStream = nodeStreamToWeb(stream);

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": mimeType,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Full file — no Range header
    const stream = client.createReadStream(filePath);
    const webStream = nodeStreamToWeb(stream);

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": String(fileSize),
        "Content-Type": mimeType,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;
    if (status === 404) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Stream failed" }, { status: 500 });
  }
}
