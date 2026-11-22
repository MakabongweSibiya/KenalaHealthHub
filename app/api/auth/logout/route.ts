import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAuthenticatedAdmin } from "@/lib/auth";
import { NO_STORE_HEADERS } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (admin) {
    await logAuditEvent({
      eventType: "ADMIN_LOGOUT",
      actor: admin.email,
      req,
      resourceId: admin.id,
      status: "OK",
    });
  }
  const response = NextResponse.json(
    { success: true, message: "Logged out" },
    { headers: NO_STORE_HEADERS }
  );
  response.cookies.delete(ADMIN_COOKIE_NAME);
  response.cookies.delete("khh_admin_session");
  return response;
}
