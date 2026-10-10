import { actionReason, applyBoardAction } from "@/features/board/actions";
import {
  BoardActionRequestSchema,
  BoardActionResultSchema,
  type PaidAction,
  PaidActionSchema,
} from "@/features/board/schema";
import { insufficientCredits, spendCredits } from "@/features/account/server";

import { boardQuote } from "../../_pricing";
import { nextNodeId, readBoard, writeBoard } from "../../_store";

const ACTION_NAMES = {
  regenerate: "Board: regenerate",
  restyle: "Board: restyle to palette",
  animate: "Board: animate between frames",
  stitch: "Board: stitch videos",
} satisfies Record<PaidAction, string>;

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
  const { action, nodeIds } = parsed.data;

  // Paid actions are charged at the quoted price, only when the selection
  // allows them. A short balance refuses before anything changes.
  const paid = PaidActionSchema.safeParse(action);
  const selected = board.nodes.filter((node) => nodeIds.includes(node.id));
  if (paid.success && actionReason(action, selected) === null) {
    const credits = boardQuote(board, nodeIds)[paid.data];
    const outcome = spendCredits(
      credits,
      `${ACTION_NAMES[paid.data]} (${String(nodeIds.length)} tiles)`,
    );
    if (!outcome.ok) return insufficientCredits(outcome.message);
  }

  const outcome = applyBoardAction(board, action, nodeIds, () => nextNodeId());
  writeBoard(outcome.board);
  return Response.json(BoardActionResultSchema.parse(outcome));
}
