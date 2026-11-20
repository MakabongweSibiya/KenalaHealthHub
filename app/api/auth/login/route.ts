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

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown-ip";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Valid email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = body.email.toLowerCase().trim();
    const password = body.password;

    if (!cleanEmail || !password || cleanEmail.length > 150 || password.length > 150) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const ipKey = `ip:${clientIp}`;
    const emailKey = `email:${cleanEmail}`;

    // 1. Check rate limit on both IP and Target Email
    const ipLimit = checkLoginRateLimit(ipKey);
    const emailLimit = checkLoginRateLimit(emailKey);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retrySeconds = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
      const retryMinutes = Math.ceil(retrySeconds / 60);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Account access is temporarily locked for ${retryMinutes} minute${
            retryMinutes === 1 ? "" : "s"
          } for security.`,
          lockedOut: true,
          retryAfterSeconds: retrySeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retrySeconds),
          },
        }
      );
    }

    // 2. Look up Admin account
    const admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      // Constant-time bcrypt execution to prevent email enumeration attacks
      await verifyDummyPassword(password);
      const failIp = recordFailedLogin(ipKey);
      recordFailedLogin(emailKey);

      return NextResponse.json(
        {
          error: failIp.lockedOut
            ? "Maximum login attempts exceeded. Access locked for 15 minutes."
            : `Invalid email or password. (${failIp.remainingAttempts} attempt${
                failIp.remainingAttempts === 1 ? "" : "s"
              } remaining)`,
        },
        { status: failIp.lockedOut ? 429 : 401 }
      );
    }

    // 3. Verify Bcrypt Password Hash
    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      const failIp = recordFailedLogin(ipKey);
      const failEmail = recordFailedLogin(emailKey);
      const remaining = Math.min(failIp.remainingAttempts, failEmail.remainingAttempts);
      const isLocked = failIp.lockedOut || failEmail.lockedOut;

      return NextResponse.json(
        {
          error: isLocked
            ? "Maximum login attempts exceeded. Access locked for 15 minutes."
            : `Invalid email or password. (${remaining} attempt${
                remaining === 1 ? "" : "s"
              } remaining)`,
        },
        { status: isLocked ? 429 : 401 }
      );
    }

    // 4. Clear failed attempt counters on successful authentication
    clearLoginAttempts(ipKey);
    clearLoginAttempts(emailKey);

    // 5. Sign hardened HS256 JWT token
    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    // 6. Set hardened HTTP-Only, SameSite=Strict Cookie
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Clear legacy cookie name if present
    response.cookies.delete("khh_admin_session");

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Authentication service error. Please try again." },
      { status: 500 }
    );
  }
}
