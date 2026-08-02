// @ts-ignore
import { Database } from "bun:sqlite";

// Initialize database
let db: any;

try {
  db = new Database("metadata.sqlite", { create: true });

  db.query(`
    CREATE TABLE IF NOT EXISTS metadata_cache (
      filename TEXT PRIMARY KEY,
      title TEXT,
      year TEXT,
      poster_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
} catch (error) {
  console.error("Failed to initialize bun:sqlite:", error);
}

export function getMetadata(filename: string) {
  if (!db) return null;
  try {
    const query = db.query("SELECT * FROM metadata_cache WHERE filename = ?");
    return query.get(filename) as any;
  } catch (error) {
    console.error("Failed to get metadata:", error);
    return null;
  }
}

export function setMetadata(filename: string, title: string, year: string, posterUrl: string) {
  if (!db) return;
  try {
    const query = db.query(`
      INSERT OR REPLACE INTO metadata_cache (filename, title, year, poster_url, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    query.run(filename, title, year, posterUrl);
  } catch (error) {
    console.error("Failed to set metadata:", error);
  }
}
