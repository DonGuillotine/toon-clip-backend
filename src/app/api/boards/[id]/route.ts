import { BoardSchema } from "@/features/board/schema";

import { readBoard } from "../_store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/boards/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  const board = readBoard(id);
  if (!board) return Response.json({ error: "No board for that storyboard." }, { status: 404 });
  return Response.json(BoardSchema.parse(board));
}
