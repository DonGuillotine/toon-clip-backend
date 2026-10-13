import { connection } from "next/server";

import { canAfford, insufficientCredits, spendCredits } from "@/features/account/server";
import { listGenerations, quoteGeneration, submitGeneration } from "@/features/create/mocks";
import { GenerationRequestSchema } from "@/features/create/schema";

export async function GET(): Promise<Response> {
  await connection();
  return Response.json(listGenerations());
}

/** Enqueue a quick create job and charge its quoted price. A short balance is a 402. */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = GenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That request is missing something." }, { status: 400 });
  }
  if (!canAfford(quoteGeneration(parsed.data).credits)) {
    return insufficientCredits(
      "Insufficient credits. Top up, or choose a shorter or smaller output.",
    );
  }
  const result = submitGeneration(parsed.data);
  if (!result.ok) return Response.json({ error: result.message }, { status: 422 });
  spendCredits(result.generation.credits, `Quick create ${parsed.data.tab}`);
  return Response.json(result.generation, { status: 201 });
}
