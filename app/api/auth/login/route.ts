/**
 * Totus Massage & Aesthetics — Hardened Admin Authentication Endpoint
 *
 * Enforces:
 * - Distributed Neon-backed rate limiting & 15-minute lockout on both IP and email
 * - Constant-time bcrypt password verification (prevents account enumeration)
 * - HS256 JWT stored exclusively in HttpOnly, Secure, SameSite=Strict cookie
 * - Strict no-store caching headers
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  verifyDummyPassword,
  signAdminToken,
  ADMIN_COOKIE_NAME,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
} from "@/lib/auth";
import { getClientIp, NO_STORE_HEADERS } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Valid email and password are required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanEmail = body.email.toLowerCase().trim();
    const password = body.password;

    if (!cleanEmail || !password || cleanEmail.length > 150 || password.length > 150) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const clientIp = getClientIp(req);
    const ipKey = `ip:${clientIp}`;
    const emailKey = `email:${cleanEmail}`;

    // 1. Check distributed Neon-backed rate limit on both IP and Target Email
    const [ipLimit, emailLimit] = await Promise.all([
      checkLoginRateLimit(ipKey),
      checkLoginRateLimit(emailKey),
    ]);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retrySeconds = Math.max(
        ipLimit.retryAfterSeconds,
        emailLimit.retryAfterSeconds
      );
      const retryMinutes = Math.ceil(retrySeconds / 60);
      await logAuditEvent({
        eventType: "ADMIN_LOGIN_LOCKED",
        actor: cleanEmail,
        req,
        status: "BLOCKED",
        metadata: { retrySeconds },
      });
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Access is temporarily locked for ${retryMinutes} minute${
            retryMinutes === 1 ? "" : "s"
          }.`,
          lockedOut: true,
          retryAfterSeconds: retrySeconds,
        },
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            "Retry-After": String(retrySeconds),
          },
        }
      );
    }

    // 2. Look up Admin account in Neon PostgreSQL
    const admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      // Constant-time bcrypt execution to prevent timing-based email enumeration
      await verifyDummyPassword(password);
      const [failIp] = await Promise.all([
        recordFailedLogin(ipKey),
        recordFailedLogin(emailKey),
      ]);

      await logAuditEvent({
        eventType: failIp.lockedOut ? "ADMIN_LOGIN_LOCKED" : "ADMIN_LOGIN_FAILED",
        actor: cleanEmail,
        req,
        status: failIp.lockedOut ? "BLOCKED" : "REJECTED",
        metadata: { reason: "invalid_credentials", remainingAttempts: failIp.remainingAttempts },
      });

      return NextResponse.json(
        {
          error: failIp.lockedOut
            ? "Maximum login attempts exceeded. Access locked for 15 minutes."
            : `Invalid email or password. (${failIp.remainingAttempts} attempt${
                failIp.remainingAttempts === 1 ? "" : "s"
              } remaining)`,
        },
        { status: failIp.lockedOut ? 429 : 401, headers: NO_STORE_HEADERS }
      );
    }

    // 3. Verify Bcrypt cost-12 password hash
    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      const [failIp, failEmail] = await Promise.all([
        recordFailedLogin(ipKey),
        recordFailedLogin(emailKey),
      ]);
      const remaining = Math.min(failIp.remainingAttempts, failEmail.remainingAttempts);
      const isLocked = failIp.lockedOut || failEmail.lockedOut;

      await logAuditEvent({
        eventType: isLocked ? "ADMIN_LOGIN_LOCKED" : "ADMIN_LOGIN_FAILED",
        actor: cleanEmail,
        req,
        status: isLocked ? "BLOCKED" : "REJECTED",
        metadata: { reason: "invalid_password", remainingAttempts: remaining },
      });

      return NextResponse.json(
        {
          error: isLocked
            ? "Maximum login attempts exceeded. Access locked for 15 minutes."
            : `Invalid email or password. (${remaining} attempt${
                remaining === 1 ? "" : "s"
              } remaining)`,
        },
        { status: isLocked ? 429 : 401, headers: NO_STORE_HEADERS }
      );
    }

    // 4. Clear failed attempt buckets on successful login
    await Promise.all([
      clearLoginAttempts(ipKey),
      clearLoginAttempts(emailKey),
      logAuditEvent({
        eventType: "ADMIN_LOGIN_SUCCESS",
        actor: admin.email,
        req,
        resourceId: admin.id,
        status: "OK",
      }),
    ]);

    // 5. Sign hardened HS256 JWT session
    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
      { headers: NO_STORE_HEADERS }
    );

    // 6. Set HTTP-Only, Secure, SameSite=Strict session cookie
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    response.cookies.delete("khh_admin_session");
    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Authentication service error. Please try again." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
