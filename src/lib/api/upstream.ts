import "server-only";

import { z } from "zod";

import { API_ORIGIN } from "@/lib/env";

/**
 * The server side of the HTTP boundary: the only code that talks to the Toon
 * Clip API. The browser never sees the session token; it lives in an
 * httpOnly cookie and is attached here.
 */

/** The bearer token for this browser's API session. */
export const SESSION_COOKIE = "toonclip-session";
/**
 * When that session ends, in Unix seconds. Readable by the page so it can say
 * how long credits stay on this browser; it holds no secret.
 */
export const SESSION_EXPIRES_COOKIE = "toonclip-session-expires";

const SessionSchema = z.object({
  token: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresAt: z.number().int().positive(),
});

export type ApiSession = z.infer<typeof SessionSchema>;

/** Starts a new API session. `null` when the API is unreachable or refuses. */
export async function startSession(): Promise<ApiSession | null> {
  try {
    const response = await fetch(`${API_ORIGIN}/v1/sessions`, {
      method: "POST",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const parsed = SessionSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

type CookieOptions = {
  readonly httpOnly: boolean;
  readonly secure: boolean;
  readonly sameSite: "lax";
  readonly path: "/";
  readonly expires: Date;
};

/** Cookie options for a session ending at `expiresAt` (Unix seconds). */
export function sessionCookieOptions(expiresAt: number, httpOnly: boolean): CookieOptions {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt * 1000),
  };
}

type ForwardInit = {
  readonly method: "GET" | "POST" | "PATCH";
  readonly token: string | null;
  readonly body: string | null;
  readonly idempotencyKey: string | null;
};

/** Sends one request to the API and returns its raw response. */
export async function forwardToApi(path: string, init: ForwardInit): Promise<Response> {
  const headers = new Headers({ accept: "application/json" });
  if (init.token !== null) headers.set("authorization", `Bearer ${init.token}`);
  if (init.idempotencyKey !== null) headers.set("idempotency-key", init.idempotencyKey);
  if (init.body !== null) headers.set("content-type", "application/json");

  const request: RequestInit = { method: init.method, headers, cache: "no-store" };
  if (init.body !== null) request.body = init.body;
  return fetch(`${API_ORIGIN}${path}`, request);
}
