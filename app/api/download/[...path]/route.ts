import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createWebDAVClient } from "@/lib/webdav";
import { getMimeType } from "@/lib/utils";
import { decrypt } from "@/lib/crypto";
import { getAccountById, verifyUserAccountAccess } from "@/lib/db";

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

async function getCredentials(
  request: NextRequest,
  filePath: string
): Promise<{ username: string; password: string } | null> {
  // Try account_id from query param (for direct DB lookup)
  const accountIdParam = request.nextUrl.searchParams.get("account_id");
  if (accountIdParam) {
    const accountId = parseInt(accountIdParam, 10);
    const session = await getSession();
    if (!session.userId) return null;

    const account = getAccountById(accountId);
    if (!account || !verifyUserAccountAccess(session.userId, accountId)) return null;

    try {
      const password = decrypt(account.webdav_password);
      return { username: account.webdav_username, password };
    } catch {
      return null;
    }
  }

  // Fallback: session (for backwards compat)
  const session = await getSession();
  if (!session.userId) return null;

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = "/" + path.map(decodeURIComponent).join("/");
  const filename = path[path.length - 1];

  const credentials = await getCredentials(request, filePath);
  if (!credentials) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { username, password } = credentials;

  try {
    const client = createWebDAVClient(username, password);

    // Get file size
    const stat = await client.stat(filePath);
    const fileSize = (stat as unknown as Record<string, unknown>).size as number;
    const mimeType = getMimeType(filePath);

    // Parse Range header (support resume/partial downloads)
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
          "Content-Disposition": `attachment; filename="${encodeURIComponent(decodeURIComponent(filename))}"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Full file download
    const stream = client.createReadStream(filePath);
    const webStream = nodeStreamToWeb(stream);

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": String(fileSize),
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(decodeURIComponent(filename))}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;
    if (status === 404) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}