import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAuthenticatedAdmin } from "@/lib/auth";
import { NO_STORE_HEADERS } from "@/lib/security";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logged out" },
    { headers: NO_STORE_HEADERS }
  );
  response.cookies.delete(ADMIN_COOKIE_NAME);
  response.cookies.delete("khh_admin_session");
  return response;
}

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }
  return NextResponse.json(
    { authenticated: true, admin },
    { headers: NO_STORE_HEADERS }
  );
}
