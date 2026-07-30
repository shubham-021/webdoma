import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createWebDAVClient } from "@/lib/webdav";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // Validate credentials by attempting to list the root directory
    const client = createWebDAVClient(username, password);

    try {
      await client.getDirectoryContents("/");
    } catch (webdavError: unknown) {
      const status =
        webdavError instanceof Error && "status" in webdavError
          ? (webdavError as { status: number }).status
          : 401;

      if (status === 401 || status === 403) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      }
      throw webdavError;
    }

    // Save credentials to session
    const session = await getSession();
    session.username = username;
    session.password = password;
    session.playerProtocol = session.playerProtocol || "vlc";
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
