import { type NextRequest } from "next/server";
import { connection } from "next/server";

import { ShotQuoteSchema } from "@/features/storyboards/schema";

import { quote } from "../../../../_lib/store";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/storyboards/[id]/shots/[shotId]/quote">,
) {
  await connection();
  const { id, shotId } = await ctx.params;
  const credits = quote(id, shotId);
  if (credits === undefined) {
    return Response.json({ error: "That shot cannot be priced." }, { status: 404 });
  }
  return Response.json(ShotQuoteSchema.parse({ credits }));
}
