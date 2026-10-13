import { type z } from "zod";

import { type Result } from "./store";

/** Turns a store result into a response, parsing success through the contract. */
export function respond<T>(result: Result<T>, schema: z.ZodType, status = 200): Response {
  if (!result.ok) return Response.json({ error: result.message }, { status: result.status });
  return Response.json(schema.parse(result.value), { status });
}

/** Reads a JSON body without throwing on a malformed one. */
export async function readJson(request: Request): Promise<unknown> {
  const body: unknown = await request.json().catch(() => null);
  return body;
}
