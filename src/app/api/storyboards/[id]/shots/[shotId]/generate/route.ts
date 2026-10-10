import { type NextRequest } from "next/server";

import { GenerateRequestSchema, StoryboardDetailSchema } from "@/features/storyboards/schema";

import { generate, quote } from "../../../../_lib/store";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/storyboards/[id]/shots/[shotId]/generate">,
) {
  const { id, shotId } = await ctx.params;
  const body: unknown = await request.json();
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That generation request is incomplete." }, { status: 400 });
  }
  // The price the user confirmed must still be the price.
  if (quote(id, shotId) !== parsed.data.quotedCredits) {
    return Response.json({ error: "The price changed. Check the new cost." }, { status: 409 });
  }
  const result = generate(id, shotId, parsed.data.kind, parsed.data.notes);
  if (!result) return Response.json({ error: "No shot with that id." }, { status: 404 });
  if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
  return Response.json(StoryboardDetailSchema.parse(result.detail));
}
