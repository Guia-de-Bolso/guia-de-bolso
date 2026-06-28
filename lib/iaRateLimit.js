import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getRequestClientIp } from "@/lib/requestClientIp";

/** Janela e limites para rotas de IA (por usuário ou IP). */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_USER = 40;
const MAX_PER_IP = 15;

/** @type {Map<string, number[]>} */
const buckets = new Map();

/** @type {{ user: Ratelimit, ip: Ratelimit } | null | undefined} */
let upstashLimiters;

/**
 * @returns {{ user: Ratelimit, ip: Ratelimit } | null}
 */
function getUpstashLimiters() {
  if (upstashLimiters !== undefined) {
    return upstashLimiters;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    upstashLimiters = null;
    return null;
  }

  const redis = new Redis({ url, token });
  upstashLimiters = {
    user: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_PER_USER, "1 h"),
      prefix: "guia:ia:user",
    }),
    ip: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_PER_IP, "1 h"),
      prefix: "guia:ia:ip",
    }),
  };

  return upstashLimiters;
}

/**
 * Rate limit em memória (fallback local / preview sem Upstash).
 * @param {import('next/server').NextRequest} request
 * @param {string|null|undefined} userId
 * @returns {{ allowed: boolean, retryAfterSec?: number }}
 */
function checkIaRateLimitMemory(request, userId) {
  const now = Date.now();
  const ip = getRequestClientIp(request);
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  const max = userId ? MAX_PER_USER : MAX_PER_IP;
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (hits.length >= max) {
    const oldest = hits[0] ?? now;
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    buckets.set(key, hits);
    return { allowed: false, retryAfterSec };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true };
}

/**
 * Rate limit distribuído (Upstash) com fallback in-memory em dev/preview.
 * @param {import('next/server').NextRequest} request
 * @param {string|null|undefined} userId
 * @returns {Promise<{ allowed: boolean, retryAfterSec?: number }>}
 */
export async function checkIaRateLimit(request, userId) {
  const limiters = getUpstashLimiters();

  if (!limiters) {
    return checkIaRateLimitMemory(request, userId);
  }

  try {
    const ip = getRequestClientIp(request);
    const limiter = userId ? limiters.user : limiters.ip;
    const key = userId ? userId : ip;
    const result = await limiter.limit(key);

    if (!result.success) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      );
      return { allowed: false, retryAfterSec };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[iaRateLimit] Upstash fallback:", err?.message ?? err);
    return checkIaRateLimitMemory(request, userId);
  }
}
