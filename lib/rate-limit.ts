import { NextRequest } from "next/server";

/** Get the real client IP — prefer cf-connecting-ip (non-spoofable) */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const maps = new Map<string, Map<string, RateLimitEntry>>();

// Periodically sweep stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [, map] of maps) {
    for (const [key, entry] of map) {
      if (now > entry.resetTime) map.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  namespace: string,
  ip: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number; resetTime: number } {
  if (!maps.has(namespace)) maps.set(namespace, new Map());
  const map = maps.get(namespace)!;
  const now = Date.now();
  const entry = map.get(ip);

  if (!entry || now > entry.resetTime) {
    map.set(ip, { count: 1, resetTime: now + windowMs });
    return { limited: false, remaining: limit - 1, resetTime: now + windowMs };
  }

  entry.count++;
  return {
    limited: entry.count > limit,
    remaining: Math.max(0, limit - entry.count),
    resetTime: entry.resetTime,
  };
}
