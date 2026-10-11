import { type NextRequest, NextResponse } from "next/server";

import { DEV_MODE_COOKIE, isDevModeValue, isDevOnlyPath } from "@/features/dev-mode/paths";
import {
  SESSION_COOKIE,
  SESSION_EXPIRES_COOKIE,
  sessionCookieOptions,
  startSession,
} from "@/lib/api/upstream";

/**
 * Runs before every page.
 *
 * 1. A fixture-backed route answers 404 unless dev mode is on.
 * 2. A browser with no API session gets one, before the page renders, so
 *    the page's first API calls all carry the same token. The cookie expires
 *    with the session, so an ended session is replaced on the next page load.
 */
export async function proxy(request: NextRequest) {
  const devMode = isDevModeValue(request.cookies.get(DEV_MODE_COOKIE)?.value);
  const response =
    !devMode && isDevOnlyPath(request.nextUrl.pathname)
      ? NextResponse.rewrite(new URL("/not-available", request.url))
      : NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const session = await startSession();
    // If the API is down the page still renders; its API calls show the
    // designed "could not reach" states and the next page load tries again.
    if (session !== null) {
      response.cookies.set(
        SESSION_COOKIE,
        session.token,
        sessionCookieOptions(session.expiresAt, true),
      );
      response.cookies.set(
        SESSION_EXPIRES_COOKIE,
        String(session.expiresAt),
        sessionCookieOptions(session.expiresAt, false),
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Pages only: not route handlers, build output, or files with an extension.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
