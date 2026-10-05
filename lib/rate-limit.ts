/**
 * Enterprise Rate Limiter
 * In-memory sliding window rate limiter for API endpoints.
 * Thread-safe, non-blocking, zero external infrastructure required.
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

const requestStore = new Map<string, number[]>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupStale(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  requestStore.forEach((timestamps: number[], key: string) => {
    const valid = timestamps.filter((t: number) => now - t < windowMs * 2);
    if (valid.length === 0) {
      requestStore.delete(key);
    } else {
      requestStore.set(key, valid);
    }
  });
}

/**
 * Checks sliding window rate limit for an identifier.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 60 }
): RateLimitResult {
  const now = Date.now();
  cleanupStale(now, config.windowMs);

  const key = `${identifier}`;
  const timestamps = requestStore.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < config.windowMs);

  if (validTimestamps.length >= config.maxRequests) {
    const oldest = validTimestamps[0] || now;
    const resetMs = Math.max(0, config.windowMs - (now - oldest));
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetMs,
    };
  }

  validTimestamps.push(now);
  requestStore.set(key, validTimestamps);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - validTimestamps.length,
    resetMs: config.windowMs,
  };
}

/**
 * Helper to extract client identifier (IP or user) from HTTP request.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}
