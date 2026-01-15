// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expiry: number }>();

export function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.data as T;
}

export function setCache(key: string, data: any, ttlSeconds: number = 60) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000
  });
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

export function getCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(p => p !== undefined).join(':');
}
