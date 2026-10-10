import { insufficientCredits, spendCredits } from "@/features/account/server";
import { createPlan, quoteFixture } from "@/features/create/mocks";
import { PlanRequestSchema } from "@/features/create/schema";

/** Plan a storyboard from an idea (spec 7.3), charged at the quoted price. */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Describe the idea first." }, { status: 400 });
  }
  const { credits } = quoteFixture({
    mode: "storyboard",
    aspectRatio: parsed.data.aspectRatio,
    lengthSec: parsed.data.lengthSec,
    highQuality: parsed.data.highQuality,
  });
  const words = parsed.data.idea.trim().split(/\s+/).slice(0, 6).join(" ");
  const outcome = spendCredits(credits, `Storyboard from idea: ${words}`);
  if (!outcome.ok) return insufficientCredits(outcome.message);
  return Response.json(createPlan(parsed.data), { status: 201 });
}
