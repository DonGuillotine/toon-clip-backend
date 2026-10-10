import { type NextRequest } from "next/server";

import { ShotActionSchema, StoryboardDetailSchema } from "@/features/storyboards/schema";

import { act } from "../../_lib/store";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/storyboards/[id]/actions">,
) {
  const { id } = await ctx.params;
  const body: unknown = await request.json();
  const action = ShotActionSchema.safeParse(body);
  if (!action.success) {
    return Response.json({ error: "That edit is not one the timeline knows." }, { status: 400 });
  }
  const result = act(id, action.data);
  if (!result) return Response.json({ error: "No storyboard with that id." }, { status: 404 });
  if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
  return Response.json(StoryboardDetailSchema.parse(result.detail));
}
