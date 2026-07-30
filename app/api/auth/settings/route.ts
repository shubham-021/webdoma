import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  playerProtocol: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.username || !session.password) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    session.playerProtocol = parsed.data.playerProtocol;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
