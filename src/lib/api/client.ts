import { type z } from "zod";

/**
 * The one typed HTTP client. Every response is parsed through the caller's
 * schema, so a payload that drifts from the contract fails here with a
 * readable error instead of rendering wrong three components later.
 *
 * Until the Toon Clip backend lands, route handlers in `src/app/api/**` serve
 * schema-parsed fixtures and this client talks to them on the same origin.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(path: string, status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

type RequestOptions = {
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly signal?: AbortSignal;
};

export async function request<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  options: RequestOptions = {},
): Promise<z.infer<Schema>> {
  const { method = "GET", body, signal } = options;
  const init: RequestInit = {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (signal) init.signal = signal;

  const response = await fetch(path, init);
  if (!response.ok) {
    throw new ApiError(path, response.status, `Request to ${path} failed (${response.status})`);
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(path, response.status, `Response from ${path} did not match its contract`);
  }
  return parsed.data;
}
