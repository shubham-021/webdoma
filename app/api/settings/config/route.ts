import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { resolve } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { getAppSetting, setAppSetting, getUserSetting, setUserSetting } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const isProd = process.env.IS_PACKAGED === 'true';
    let envData = { TMDB_API_KEY: "", SESSION_SECRET: "", TB_SB_ANON_KEY: "" };
    let syncplayData = { SYNCPLAY_HOST: "", SYNCPLAY_ROOM: "", SYNCPLAY_USER: "", SYNCPLAY_PASS: "" };

    if (isProd) {
      envData = {
        TMDB_API_KEY: getUserSetting(session.userId, "TMDB_API_KEY") || "",
        SESSION_SECRET: getAppSetting("SESSION_SECRET") || "",
        TB_SB_ANON_KEY: getUserSetting(session.userId, "TB_SB_ANON_KEY") || "",
      };

      syncplayData = {
        SYNCPLAY_HOST: getUserSetting(session.userId, "SYNCPLAY_HOST") || "",
        SYNCPLAY_ROOM: getUserSetting(session.userId, "SYNCPLAY_ROOM") || "",
        SYNCPLAY_USER: getUserSetting(session.userId, "SYNCPLAY_USER") || "",
        SYNCPLAY_PASS: getUserSetting(session.userId, "SYNCPLAY_PASS") || "",
      };
    } else {
      const cwd = process.cwd();

      // Read .env
      const envPath = resolve(cwd, ".env");
      if (existsSync(envPath)) {
        const raw = readFileSync(envPath, "utf8");
        for (const line of raw.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const [key, ...rest] = trimmed.split("=");
          const val = rest.join("=").replace(/^['"]|['"]$/g, "").trim();
          if (key === "TMDB_API_KEY") envData.TMDB_API_KEY = val;
          if (key === "SESSION_SECRET") envData.SESSION_SECRET = val;
          if (key === "TB_SB_ANON_KEY") envData.TB_SB_ANON_KEY = val;
        }
      }

      // Read syncplay.conf
      const syncplayPath = resolve(cwd, "syncplay.conf");
      if (existsSync(syncplayPath)) {
        const raw = readFileSync(syncplayPath, "utf8");
        for (const line of raw.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx === -1) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          
          if (key === "SYNCPLAY_HOST") syncplayData.SYNCPLAY_HOST = val;
          if (key === "SYNCPLAY_ROOM") syncplayData.SYNCPLAY_ROOM = val;
          if (key === "SYNCPLAY_USER") syncplayData.SYNCPLAY_USER = val;
          if (key === "SYNCPLAY_PASS") syncplayData.SYNCPLAY_PASS = val;
        }
      }
    }

    return NextResponse.json({ success: true, env: envData, syncplay: syncplayData });
  } catch (error) {
    console.error("Failed to read settings config:", error);
    return NextResponse.json({ error: "Failed to read settings config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { env, syncplay } = body;

    const isProd = process.env.IS_PACKAGED === 'true';

    if (isProd) {
      // Write to DB in production
      if (env) {
        if (env.TMDB_API_KEY !== undefined) setUserSetting(session.userId, "TMDB_API_KEY", env.TMDB_API_KEY);
        if (env.SESSION_SECRET !== undefined) {
          setAppSetting("SESSION_SECRET", env.SESSION_SECRET);
          process.env.SESSION_SECRET = env.SESSION_SECRET; // update globally
        }
        if (env.TB_SB_ANON_KEY !== undefined) setUserSetting(session.userId, "TB_SB_ANON_KEY", env.TB_SB_ANON_KEY);
      }

      if (syncplay) {
        if (syncplay.SYNCPLAY_HOST !== undefined) setUserSetting(session.userId, "SYNCPLAY_HOST", syncplay.SYNCPLAY_HOST);
        if (syncplay.SYNCPLAY_ROOM !== undefined) setUserSetting(session.userId, "SYNCPLAY_ROOM", syncplay.SYNCPLAY_ROOM);
        if (syncplay.SYNCPLAY_USER !== undefined) setUserSetting(session.userId, "SYNCPLAY_USER", syncplay.SYNCPLAY_USER);
        if (syncplay.SYNCPLAY_PASS !== undefined) setUserSetting(session.userId, "SYNCPLAY_PASS", syncplay.SYNCPLAY_PASS);
      }
    } else {
      // Write to files in development
      const cwd = process.cwd();

      // Write .env
      if (env) {
        const envPath = resolve(cwd, ".env");
        let envContent = "";
        if (env.TMDB_API_KEY !== undefined) {
          envContent += `TMDB_API_KEY=${env.TMDB_API_KEY}\n`;
          process.env.TMDB_API_KEY = env.TMDB_API_KEY;
        }
        if (env.SESSION_SECRET !== undefined) {
          envContent += `SESSION_SECRET=${env.SESSION_SECRET}\n`;
          process.env.SESSION_SECRET = env.SESSION_SECRET;
        }
        if (env.TB_SB_ANON_KEY !== undefined) {
          envContent += `TB_SB_ANON_KEY=${env.TB_SB_ANON_KEY}\n`;
          process.env.TB_SB_ANON_KEY = env.TB_SB_ANON_KEY;
        }
        if (envContent) {
          writeFileSync(envPath, envContent, "utf8");
        }
      }

      // Write syncplay.conf
      if (syncplay) {
        const syncplayPath = resolve(cwd, "syncplay.conf");
        let syncplayContent = "";
        if (syncplay.SYNCPLAY_HOST !== undefined) syncplayContent += `SYNCPLAY_HOST=${syncplay.SYNCPLAY_HOST}\n`;
        if (syncplay.SYNCPLAY_ROOM !== undefined) syncplayContent += `SYNCPLAY_ROOM=${syncplay.SYNCPLAY_ROOM}\n`;
        if (syncplay.SYNCPLAY_USER !== undefined) syncplayContent += `SYNCPLAY_USER=${syncplay.SYNCPLAY_USER}\n`;
        if (syncplay.SYNCPLAY_PASS !== undefined) syncplayContent += `SYNCPLAY_PASS=${syncplay.SYNCPLAY_PASS}\n`;
        
        if (syncplayContent) {
          writeFileSync(syncplayPath, syncplayContent, "utf8");
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Config post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

