import { type NextRequest } from "next/server";
import { connection } from "next/server";

import { StoryboardDetailSchema } from "@/features/storyboards/schema";

import { getBoard } from "../_lib/store";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/storyboards/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const detail = getBoard(id);
  if (!detail) return Response.json({ error: "No storyboard with that id." }, { status: 404 });
  return Response.json(StoryboardDetailSchema.parse(detail));
}
