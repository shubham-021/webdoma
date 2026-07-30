import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";

const switchSchema = z.object({
  username: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.username || !session.password) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = switchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const { username } = parsed.data;
    const account = session.accounts?.find(a => a.username === username);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    session.username = account.username;
    session.password = account.password;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Switch account error:", error);
    return NextResponse.json({ error: "Failed to switch account" }, { status: 500 });
  }
}
