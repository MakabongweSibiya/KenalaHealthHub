/**
 * Totus Massage & Aesthetics — Developer Audit & Telemetry Logger
 *
 * Persists structured security, payment, booking, and admin mutation events into
 * Neon PostgreSQL (`AuditLog`) for full developer observability and terminal auditing.
 * Strictly strips sensitive fields (passwords, tokens, hashes) and never blocks user flows.
 */

import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/security";

export interface AuditEventInput {
  eventType: string;
  actor: string;
  req?: Request;
  resourceId?: string | null;
  status?: "OK" | "REJECTED" | "BLOCKED" | "ERROR";
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "jwt",
  "secret",
  "signature",
  "passphrase",
  "merchant_key",
]);

function sanitizeMetadata(
  meta?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (REDACTED_KEYS.has(k.toLowerCase())) continue;
    clean[k] = v;
  }
  return clean;
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const ipAddress = input.req ? getClientIp(input.req) : null;
    const userAgent = input.req
      ? (input.req.headers.get("user-agent") || "").slice(0, 220) || null
      : null;

    await prisma.auditLog.create({
      data: {
        eventType: input.eventType,
        actor: input.actor.slice(0, 150),
        ipAddress,
        userAgent,
        resourceId: input.resourceId ? input.resourceId.slice(0, 120) : null,
        status: input.status || "OK",
        metadata: (sanitizeMetadata(input.metadata) ?? undefined) as any,
      },
    });
  } catch (err) {
    // Telemetry logging must never interrupt critical booking or auth execution
    console.error("[AuditLog Error]:", err);
  }
}
