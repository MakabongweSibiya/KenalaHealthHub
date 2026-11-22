/**
 * Totus Massage & Aesthetics — Central Security, Rate Limiting & Sanitization Utilities
 *
 * Provides:
 * - Distributed Neon PostgreSQL-backed rate limiting (with in-memory resilience fallback)
 * - Strict client IP extraction from trusted Vercel proxy headers
 * - Input sanitization & strict image URL / data-URI validation
 * - Private no-store cache headers for authenticated & PII-bearing API responses
 */

import { prisma } from "@/lib/prisma";

export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
};

interface MemoryBucket {
  count: number;
  windowStart: number;
  lockedUntil: number | null;
}

const globalForBuckets = globalThis as unknown as {
  totusRateLimitFallback?: Map<string, MemoryBucket>;
};

const memoryBuckets =
  globalForBuckets.totusRateLimitFallback ?? new Map<string, MemoryBucket>();
globalForBuckets.totusRateLimitFallback = memoryBuckets;

/**
 * Extracts the originating client IP address safely from Vercel / reverse-proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Checks whether a given rate-limit key is currently permitted without incrementing it.
 * Backed by Neon PostgreSQL so limits hold consistently across serverless cold starts.
 */
export async function checkPersistentRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitCheckResult> {
  const now = Date.now();

  try {
    const record = await prisma.rateLimit.findUnique({ where: { key } });
    if (!record) {
      return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
    }

    if (record.lockedUntil && record.lockedUntil.getTime() > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((record.lockedUntil.getTime() - now) / 1000),
      };
    }

    if (now - record.windowStart.getTime() > windowMs) {
      await prisma.rateLimit.delete({ where: { key } }).catch(() => {});
      return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
    }

    const remaining = Math.max(0, maxAttempts - record.count);
    return {
      allowed: remaining > 0,
      remaining,
      retryAfterSeconds:
        remaining > 0
          ? 0
          : Math.max(1, Math.ceil((record.windowStart.getTime() + windowMs - now) / 1000)),
    };
  } catch {
    // Graceful in-memory fallback so rate limiting never fails open
    const mem = memoryBuckets.get(key);
    if (!mem) return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
    if (mem.lockedUntil && mem.lockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((mem.lockedUntil - now) / 1000),
      };
    }
    if (now - mem.windowStart > windowMs) {
      memoryBuckets.delete(key);
      return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
    }
    const remaining = Math.max(0, maxAttempts - mem.count);
    return { allowed: remaining > 0, remaining, retryAfterSeconds: 0 };
  }
}

/**
 * Records a hit against a rate-limit bucket (used for failed logins or public API quotas).
 */
export async function recordPersistentRateLimitHit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  lockoutMs: number
): Promise<{
  remaining: number;
  lockedOut: boolean;
  retryAfterSeconds: number;
}> {
  const now = Date.now();
  const nowDate = new Date(now);

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || now - existing.windowStart.getTime() > windowMs) {
      const isLocked = maxAttempts <= 1;
      const lockedUntil = isLocked ? new Date(now + lockoutMs) : null;
      await prisma.rateLimit.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          windowStart: nowDate,
          lockedUntil,
        },
        update: {
          count: 1,
          windowStart: nowDate,
          lockedUntil,
        },
      });
      return {
        remaining: Math.max(0, maxAttempts - 1),
        lockedOut: isLocked,
        retryAfterSeconds: isLocked ? Math.ceil(lockoutMs / 1000) : 0,
      };
    }

    const nextCount = existing.count + 1;
    const isLocked = nextCount >= maxAttempts;
    const lockedUntil = isLocked ? new Date(now + lockoutMs) : existing.lockedUntil;

    await prisma.rateLimit.update({
      where: { key },
      data: {
        count: nextCount,
        lockedUntil,
      },
    });

    return {
      remaining: Math.max(0, maxAttempts - nextCount),
      lockedOut: isLocked,
      retryAfterSeconds: isLocked ? Math.ceil(lockoutMs / 1000) : 0,
    };
  } catch {
    // In-memory fallback
    const mem = memoryBuckets.get(key);
    if (!mem || now - mem.windowStart > windowMs) {
      memoryBuckets.set(key, { count: 1, windowStart: now, lockedUntil: null });
      return { remaining: Math.max(0, maxAttempts - 1), lockedOut: false, retryAfterSeconds: 0 };
    }
    const nextCount = mem.count + 1;
    const lockedUntil = nextCount >= maxAttempts ? now + lockoutMs : null;
    memoryBuckets.set(key, {
      count: nextCount,
      windowStart: mem.windowStart,
      lockedUntil,
    });
    return {
      remaining: Math.max(0, maxAttempts - nextCount),
      lockedOut: Boolean(lockedUntil),
      retryAfterSeconds: lockedUntil ? Math.ceil(lockoutMs / 1000) : 0,
    };
  }
}

/**
 * Clears a rate-limit bucket (e.g., immediately upon successful admin authentication).
 */
export async function clearPersistentRateLimit(key: string): Promise<void> {
  memoryBuckets.delete(key);
  try {
    await prisma.rateLimit.delete({ where: { key } });
  } catch {
    // Record may already not exist; ignore safely
  }
}

/**
 * Strips control characters & angle brackets and caps string length to prevent injection/oversized storage.
 */
export function sanitizePlainText(input: unknown, maxLength = 300): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates that an uploaded or external image URL is safe (blocks javascript:, SVG XSS, and oversized payloads).
 */
export function validateSafeImageUrl(input: unknown): {
  valid: boolean;
  value: string | null;
  error?: string;
} {
  if (input === null || input === undefined || input === "") {
    return { valid: true, value: null };
  }
  if (typeof input !== "string") {
    return { valid: false, value: null, error: "Invalid image format." };
  }

  const trimmed = input.trim();
  if (!trimmed) return { valid: true, value: null };

  // Allow safe raster Data URIs up to ~4MB base64 (never allow SVG data URIs)
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    if (trimmed.length > 5_500_000) {
      return {
        valid: false,
        value: null,
        error: "Uploaded photo is too large. Please choose an image under 3.5MB.",
      };
    }
    return { valid: true, value: trimmed };
  }

  // Allow safe relative local paths
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && trimmed.length <= 500) {
    return { valid: true, value: trimmed };
  }

  // Allow explicit HTTPS / HTTP URLs only
  try {
    const parsed = new URL(trimmed);
    if ((parsed.protocol === "https:" || parsed.protocol === "http:") && trimmed.length <= 2000) {
      return { valid: true, value: trimmed };
    }
  } catch {
    // Fall through to error
  }

  return {
    valid: false,
    value: null,
    error: "Image must be a valid HTTPS URL or uploaded PNG/JPG/WebP photo.",
  };
}

/**
 * Validates ISO calendar date strings strictly (YYYY-MM-DD).
 */
export function isValidIsoDate(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}
