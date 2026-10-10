import { TopUpRequestSchema } from "@/features/account/schema";
import { getAccount, topUpCredits } from "@/features/account/server";

/**
 * Buy a credit pack. CONTRACT: unconfirmed. Payment (card, bank transfer,
 * crypto) is an open decision, so the fixture credits the pack at once.
 */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = TopUpRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Pick a pack." }, { status: 400 });
  const outcome = topUpCredits(parsed.data.packId);
  if (outcome === null) {
    return Response.json({ error: "That pack is not on sale." }, { status: 404 });
  }
  if (!outcome.ok) return Response.json({ error: outcome.message }, { status: 400 });
  return Response.json(getAccount());
}
