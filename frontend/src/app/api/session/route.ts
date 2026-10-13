import { type NextRequest } from "next/server";

import { SESSION_COOKIE, SESSION_EXPIRES_COOKIE } from "@/lib/api/upstream";

/**
 * Whether this browser holds an API session, and when it ends. The token
 * itself never leaves the httpOnly cookie.
 */
export function GET(request: NextRequest) {
  const active = request.cookies.has(SESSION_COOKIE);
  const expiresRaw = Number(request.cookies.get(SESSION_EXPIRES_COOKIE)?.value);
  const expiresAt = active && Number.isInteger(expiresRaw) && expiresRaw > 0 ? expiresRaw : null;
  return Response.json({ active, expiresAt });
}
