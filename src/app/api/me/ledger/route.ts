import { connection } from "next/server";

import { LedgerSchema } from "@/features/account/schema";
import { getLedger } from "@/features/account/server";

/** Read per request: the store changes as credits move. */
export async function GET(): Promise<Response> {
  await connection();
  return Response.json(LedgerSchema.parse(getLedger()));
}
