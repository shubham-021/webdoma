import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createToken } from "@/lib/tokens";

const createTokenSchema = z.object({
  filePath: z.string().min(1, "File path is required"),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.username || !session.password) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, expiresAt } = createToken(
      parsed.data.filePath,
      session.username,
      session.password
    );

    return NextResponse.json({
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Create token error:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
