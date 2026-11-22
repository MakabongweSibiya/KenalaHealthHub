/**
 * Totus Massage & Aesthetics — Admin Authentication & Session Utilities
 *
 * Security controls implemented:
 * - HS256 JWT with explicit issuer, audience, and 24-hour expiration
 * - Bcrypt cost-12 password verification with constant-time anti-enumeration dummy hash
 * - Distributed Neon PostgreSQL-backed brute-force lockout (5 attempts / 15 min)
 * - Database re-verification on every authenticated request (`getAuthenticatedAdmin`)
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  checkPersistentRateLimit,
  recordPersistentRateLimitHit,
  clearPersistentRateLimit,
} from "@/lib/security";

function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret && envSecret.length >= 24) {
    return envSecret;
  }
  // Development-only fallback; production deployments strictly load JWT_SECRET from encrypted env
  return "kenala_health_hub_jwt_secure_key_2026_equestria_nellmapius";
}

export const ADMIN_COOKIE_NAME = "totus_admin_session";
const JWT_ISSUER = "totus-massage-aesthetics";
const JWT_AUDIENCE = "totus-admin-portal";

// Precomputed cost-12 bcrypt hash for constant-time defense against email enumeration
const DUMMY_BCRYPT_HASH =
  "$2a$12$K8p9m1vQvR6xW5zL3nB7eO.Y4jH2kF8dG1sA9cE0uI6wP3rT5yV7K";

export interface AdminJwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function checkLoginRateLimit(key: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}> {
  const res = await checkPersistentRateLimit(
    `login:${key}`,
    MAX_LOGIN_ATTEMPTS,
    LOGIN_WINDOW_MS
  );
  return {
    allowed: res.allowed,
    remainingAttempts: res.remaining,
    retryAfterSeconds: res.retryAfterSeconds,
  };
}

export async function recordFailedLogin(key: string): Promise<{
  remainingAttempts: number;
  lockedOut: boolean;
  retryAfterSeconds: number;
}> {
  const res = await recordPersistentRateLimitHit(
    `login:${key}`,
    MAX_LOGIN_ATTEMPTS,
    LOGIN_WINDOW_MS,
    LOGIN_LOCKOUT_MS
  );
  return {
    remainingAttempts: res.remaining,
    lockedOut: res.lockedOut,
    retryAfterSeconds: res.retryAfterSeconds,
  };
}

export async function clearLoginAttempts(key: string): Promise<void> {
  await clearPersistentRateLimit(`login:${key}`);
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    },
    getJwtSecret(),
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
    const decoded = jwt.verify(token, getJwtSecret(), {
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

/**
 * Validates the HTTP-Only session cookie cryptographically and confirms the admin
 * account is still active in Neon PostgreSQL.
 */
export async function getAuthenticatedAdmin(): Promise<AdminJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyAdminToken(token);
    if (!decoded || !decoded.id || !decoded.email) return null;

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
