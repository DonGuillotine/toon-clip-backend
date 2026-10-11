import { type NextRequest } from "next/server";
import { z } from "zod";

import { forwardToApi, SESSION_COOKIE } from "@/lib/api/upstream";

/**
 * The live API boundary. The browser calls `/api/v1/...`; this handler
 * attaches the session token from its httpOnly cookie and forwards to the
 * Toon Clip API. It is the only file that knows where those bytes come from.
 *
 * Only the routes the app uses are forwarded, and API errors are rewritten
 * as `{ error }` copy so the client reads one error shape everywhere.
 */

type Method = "GET" | "POST" | "PATCH";

const ID = "[A-Za-z0-9_-]{1,100}";

/** Every API route the app calls, as `METHOD /v1/...` patterns. */
const ROUTES: readonly { readonly method: Method; readonly pattern: RegExp }[] = [
  { method: "GET", pattern: /^\/v1\/catalog$/ },
  { method: "POST", pattern: /^\/v1\/prompt-previews$/ },
  { method: "GET", pattern: /^\/v1\/projects$/ },
  { method: "POST", pattern: /^\/v1\/projects$/ },
  { method: "GET", pattern: new RegExp(`^/v1/projects/${ID}$`) },
  { method: "PATCH", pattern: new RegExp(`^/v1/projects/${ID}/shots/${ID}$`) },
  { method: "POST", pattern: new RegExp(`^/v1/projects/${ID}/shots/${ID}/revisions$`) },
  { method: "POST", pattern: new RegExp(`^/v1/projects/${ID}/exports$`) },
  { method: "GET", pattern: new RegExp(`^/v1/exports/${ID}$`) },
  { method: "GET", pattern: /^\/v1\/balance$/ },
  { method: "POST", pattern: /^\/v1\/wallet-challenges$/ },
  { method: "POST", pattern: /^\/v1\/wallet-links$/ },
  { method: "POST", pattern: /^\/v1\/payment-intents$/ },
  { method: "GET", pattern: new RegExp(`^/v1/payment-intents/${ID}$`) },
  { method: "POST", pattern: new RegExp(`^/v1/payment-intents/${ID}/verify$`) },
];

const DetailSchema = z.object({ detail: z.string().min(1) });

const COPY = {
  unreachable: "Toon Clip could not reach its server. Check your connection and try again.",
  session: "Your session has ended. Reload the page to start a new one.",
  rejected: "That request was not accepted. Reload the page and try again.",
  notFound: "That could not be found. It may have been removed.",
  credits: "You do not have enough credits for that. Buy credits, then try again.",
} satisfies Record<string, string>;

function errorResponse(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** The API's error, rewritten as `{ error }` copy. */
async function translateError(upstream: Response): Promise<Response> {
  const body: unknown = await upstream.json().catch(() => null);
  const detail = DetailSchema.safeParse(body);
  if (upstream.status === 401) return errorResponse(401, COPY.session);
  if (upstream.status >= 500) return errorResponse(502, COPY.unreachable);
  if (upstream.status === 404) return errorResponse(404, COPY.notFound);
  // The API sends `{ code: "insufficient_credits", balance, required }` here.
  if (upstream.status === 402) return errorResponse(402, COPY.credits);
  // A 422 with a list of field errors is a contract problem, not user copy.
  return errorResponse(upstream.status, detail.success ? detail.data.detail : COPY.rejected);
}

async function handle(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/[...path]">,
  method: Method,
): Promise<Response> {
  const { path } = await ctx.params;
  const upstreamPath = `/v1/${path.map(encodeURIComponent).join("/")}`;
  if (!ROUTES.some((route) => route.method === method && route.pattern.test(upstreamPath))) {
    return errorResponse(404, COPY.notFound);
  }

  const body = method === "GET" ? null : await request.text();
  let upstream: Response;
  try {
    upstream = await forwardToApi(upstreamPath, {
      method,
      token: request.cookies.get(SESSION_COOKIE)?.value ?? null,
      body: body === null || body === "" ? null : body,
      idempotencyKey: request.headers.get("idempotency-key"),
    });
  } catch {
    return errorResponse(502, COPY.unreachable);
  }

  if (!upstream.ok) return translateError(upstream);

  const json: unknown = await upstream.json().catch(() => null);
  if (json === null) return errorResponse(502, COPY.unreachable);
  return Response.json(json, { status: upstream.status });
}

export function GET(request: NextRequest, ctx: RouteContext<"/api/v1/[...path]">) {
  return handle(request, ctx, "GET");
}

export function POST(request: NextRequest, ctx: RouteContext<"/api/v1/[...path]">) {
  return handle(request, ctx, "POST");
}

export function PATCH(request: NextRequest, ctx: RouteContext<"/api/v1/[...path]">) {
  return handle(request, ctx, "PATCH");
}
