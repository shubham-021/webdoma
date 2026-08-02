/// <reference types="bun" />
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getUserByUsername, createUser, getAccountsByUserId } from "@/lib/db";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // Check if user already exists
    const existing = getUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password using Bun's built-in bcrypt
    const hashedPassword = await Bun.password.hash(password);

    // Create user
    const userId = createUser(username, hashedPassword);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Save user ID to session
    const session = await getSession();
    session.userId = userId;
    session.playerProtocol = "vlc";
    await session.save();

    return NextResponse.json({ success: true, accounts: [] });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}