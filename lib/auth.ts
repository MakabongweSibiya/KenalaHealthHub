import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "kenala_health_hub_jwt_secure_key_2026_equestria_nellmapius";

export const ADMIN_COOKIE_NAME = "totus_admin_session";
const JWT_ISSUER = "totus-massage-aesthetics";
const JWT_AUDIENCE = "totus-admin-portal";

// Precomputed cost-12 bcrypt hash for constant-time timing-attack defense when email is not found
const DUMMY_BCRYPT_HASH =
  "$2a$12$K8p9m1vQvR6xW5zL3nB7eO.Y4jH2kF8dG1sA9cE0uI6wP3rT5yV7K";

export interface AdminJwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

// In-memory rate-limit store per serverless instance + brute-force tracker
interface RateLimitEntry {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const globalForRateLimit = globalThis as unknown as {
  loginRateLimitMap?: Map<string, RateLimitEntry>;
};

const rateLimitMap =
  globalForRateLimit.loginRateLimitMap ?? new Map<string, RateLimitEntry>();
globalForRateLimit.loginRateLimitMap = rateLimitMap;

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  // Check if currently locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Reset if window expired
  if (now - entry.firstAttemptAt > WINDOW_MS) {
    rateLimitMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - entry.count);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
    retryAfterSeconds: 0,
  };
}

export function recordFailedLogin(key: string): {
  remainingAttempts: number;
  lockedOut: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || now - existing.firstAttemptAt > WINDOW_MS) {
    rateLimitMap.set(key, {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    });
    return {
      remainingAttempts: MAX_ATTEMPTS - 1,
      lockedOut: false,
      retryAfterSeconds: 0,
    };
  }

  const newCount = existing.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS ? now + LOCKOUT_MS : null;

  rateLimitMap.set(key, {
    count: newCount,
    firstAttemptAt: existing.firstAttemptAt,
    lockedUntil,
  });

  return {
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - newCount),
    lockedOut: Boolean(lockedUntil),
    retryAfterSeconds: lockedUntil ? Math.ceil(LOCKOUT_MS / 1000) : 0,
  };
}

export function clearLoginAttempts(key: string): void {
  rateLimitMap.delete(key);
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "24h",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as AdminJwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyDummyPassword(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
}

export async function getAuthenticatedAdmin(): Promise<AdminJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyAdminToken(token);
    if (!decoded || !decoded.id || !decoded.email) return null;

    // Verify admin still exists in the database and email matches
    const dbAdmin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!dbAdmin || dbAdmin.email.toLowerCase() !== decoded.email.toLowerCase()) {
      return null;
    }

    return {
      id: dbAdmin.id,
      email: dbAdmin.email,
      name: dbAdmin.name,
      role: dbAdmin.role,
    };
  } catch {
    return null;
  }
}
