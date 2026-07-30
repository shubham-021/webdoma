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
        { success: false, error: parsed.error.issues[0].message },
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
    
    // Ensure all previously logged-in accounts are preserved in session.accounts
    if (!session.accounts) {
      session.accounts = [];
    }
    
    // If there was a previously active session, make sure it is in session.accounts
    if (session.username && session.password) {
      const prevExisting = session.accounts.find(a => a.username === session.username);
      if (!prevExisting) {
        session.accounts.push({ username: session.username, password: session.password });
      } else {
        prevExisting.password = session.password;
      }
    }
    
    // Now set the new active session credentials
    session.username = username;
    session.password = password;
    session.playerProtocol = session.playerProtocol || "vlc";
    
    // Make sure the new account is in session.accounts
    const existing = session.accounts.find(a => a.username === username);
    if (existing) {
      existing.password = password;
    } else {
      session.accounts.push({ username, password });
    }

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
