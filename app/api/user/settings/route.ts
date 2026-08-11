import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  
  try {
    const user = db.query("SELECT tmdb_api_key, syncplay_host, syncplay_room, syncplay_user, syncplay_pass FROM users WHERE id = ?").get(session.userId) as any;
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      tmdb_api_key: user.tmdb_api_key || "",
      syncplay_host: user.syncplay_host || "",
      syncplay_room: user.syncplay_room || "",
      syncplay_user: user.syncplay_user || "",
      syncplay_pass: user.syncplay_pass || "",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getDb();

    db.query(`
      UPDATE users 
      SET 
        tmdb_api_key = ?, 
        syncplay_host = ?, 
        syncplay_room = ?, 
        syncplay_user = ?, 
        syncplay_pass = ?
      WHERE id = ?
    `).run(
      body.tmdb_api_key || null,
      body.syncplay_host || null,
      body.syncplay_room || null,
      body.syncplay_user || null,
      body.syncplay_pass || null,
      session.userId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
