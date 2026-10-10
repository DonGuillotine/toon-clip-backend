import { connection } from "next/server";

import { ProfileUpdateSchema } from "@/features/account/schema";
import { getAccount, updateProfile } from "@/features/account/server";

/** Read per request: the store changes as credits move. */
export async function GET(): Promise<Response> {
  await connection();
  return Response.json(getAccount());
}

/** Edit display name and handle. */
export async function PATCH(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Check the name and handle." }, { status: 400 });
  }
  const outcome = updateProfile(parsed.data);
  if (!outcome.ok) return Response.json({ error: outcome.message }, { status: 409 });
  return Response.json(outcome.account);
}
