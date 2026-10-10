import { BoardSchema } from "@/features/board/schema";
import { syncTimelineNodes } from "@/features/board/send-shot";

import { getBoard as getTimeline } from "../../storyboards/_lib/store";
import { readBoard, writeBoard } from "../_store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/boards/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  const board = readBoard(id);
  if (!board) return Response.json({ error: "No board for that storyboard." }, { status: 404 });
  const timeline = getTimeline(id);
  const synced = timeline ? syncTimelineNodes(board, timeline) : board;
  if (synced !== board) writeBoard(synced);
  return Response.json(BoardSchema.parse(synced));
}
