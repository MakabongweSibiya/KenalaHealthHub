/**
 * Totus Massage & Aesthetics — Edge Security Middleware
 *
 * Performs cryptographic HS256 JWT verification at the Edge using Web Crypto (`crypto.subtle`)
 * before any Admin Dashboard route is served, ensuring unauthenticated visitors are redirected
 * immediately to `/admin/login` without leaking dashboard markup.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "totus_admin_session";
const EXPECTED_ISSUER = "totus-massage-aesthetics";
const EXPECTED_AUDIENCE = "totus-admin-portal";

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyEdgeAdminJwt(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, sigB64] = parts;

    const header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(headerB64)));
    if (header.alg !== "HS256") return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(sigB64);
    const validSig = await crypto.subtle.verify(
      "HMAC",
      key,
      signature.buffer as ArrayBuffer,
      data
    );
    if (!validSig) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payloadB64)));
    const nowSec = Math.floor(Date.now() / 1000);

    if (!payload.id || !payload.email) return false;
    if (payload.iss !== EXPECTED_ISSUER || payload.aud !== EXPECTED_AUDIENCE) return false;
    if (typeof payload.exp === "number" && payload.exp <= nowSec) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/dashboard")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const secret = process.env.JWT_SECRET?.trim();

    // Fail closed if JWT_SECRET is absent or token verification fails
    const isValid =
      Boolean(secret && secret.length >= 24 && token) &&
      (await verifyEdgeAdminJwt(token!, secret!));

    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return res;
    }
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/auth")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"],
};
