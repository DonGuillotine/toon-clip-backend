import { BoardActionResultSchema, SendShotRequestSchema } from "@/features/board/schema";
import { sendShotToBoard } from "@/features/board/send-shot";

import { readBoard, writeBoard } from "../../_store";

/** Send a timeline shot to the storyboard's board. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/boards/[id]/timeline">,
): Promise<Response> {
  const { id } = await ctx.params;
  const board = readBoard(id);
  if (!board) return Response.json({ error: "No board for that storyboard." }, { status: 404 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = SendShotRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That shot could not be read." }, { status: 400 });
  }

  const outcome = sendShotToBoard(board, parsed.data);
  writeBoard(outcome.board);
  return Response.json(BoardActionResultSchema.parse(outcome));
}
