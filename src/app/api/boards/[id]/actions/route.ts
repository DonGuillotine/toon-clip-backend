import { applyBoardAction } from "@/features/board/actions";
import { BoardActionRequestSchema, BoardActionResultSchema } from "@/features/board/schema";

import { nextNodeId, readBoard, writeBoard } from "../../_store";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/boards/[id]/actions">,
): Promise<Response> {
  const { id } = await ctx.params;
  const board = readBoard(id);
  if (!board) return Response.json({ error: "No board for that storyboard." }, { status: 404 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = BoardActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That action could not be read." }, { status: 400 });
  }

  const outcome = applyBoardAction(board, parsed.data.action, parsed.data.nodeIds, () =>
    nextNodeId(),
  );
  writeBoard(outcome.board);
  return Response.json(BoardActionResultSchema.parse(outcome));
}
