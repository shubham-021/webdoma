/// <reference types="bun" />
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getUserByUsername, createUser, getAccountsByUserId } from "@/lib/db";

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

    // Look up user
    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Verify password using Bun's built-in bcrypt
    const isValid = await Bun.password.verify(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Save user ID to session
    const session = await getSession();
    session.userId = user.id;
    session.playerProtocol = session.playerProtocol || "mpv";
    await session.save();

    // Fetch associated TorBox accounts
    const accounts = getAccountsByUserId(user.id);

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}