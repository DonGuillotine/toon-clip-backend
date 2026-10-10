import { type NextRequest } from "next/server";

import { readBoard } from "../../_store";
import { boardQuote } from "../../_pricing";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/boards/[id]/quote">,
): Promise<Response> {
  const { id } = await ctx.params;
  const board = readBoard(id);
  if (!board) return Response.json({ error: "No board for that storyboard." }, { status: 404 });

  const ids = (request.nextUrl.searchParams.get("nodes") ?? "").split(",").filter(Boolean);
  return Response.json(boardQuote(board, ids));
}
