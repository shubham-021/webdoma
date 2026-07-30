interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class ServerCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Persist cache across hot-reloads in Next.js development mode
const globalForCache = globalThis as unknown as { serverCache: ServerCache };
export const serverCache = globalForCache.serverCache || new ServerCache();
if (process.env.NODE_ENV !== "production") {
  globalForCache.serverCache = serverCache;
}
