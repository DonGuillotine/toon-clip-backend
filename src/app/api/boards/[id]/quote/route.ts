import { type NextRequest } from "next/server";

import { isMedia } from "@/features/board/actions";
import { BOARD_RATES } from "@/features/board/mocks";
import { BoardQuoteSchema } from "@/features/board/schema";

import { readBoard } from "../../_store";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/boards/[id]/quote">,
): Promise<Response> {
  const { id } = await ctx.params;
  const board = readBoard(id);
  if (!board) return Response.json({ error: "No board for that storyboard." }, { status: 404 });

  const ids = new Set((request.nextUrl.searchParams.get("nodes") ?? "").split(",").filter(Boolean));
  const selected = board.nodes.filter((node) => ids.has(node.id));
  const media = selected.filter(isMedia);
  const images = selected.filter((node) => node.kind === "image").length;
  const videos = selected.filter((node) => node.kind === "video").length;

  return Response.json(
    BoardQuoteSchema.parse({
      regenerate: BOARD_RATES.regenerate * media.filter((node) => node.state !== "locked").length,
      restyle: BOARD_RATES.restyle * media.length,
      animate: BOARD_RATES.animate * Math.max(images - 1, 0),
      stitch: BOARD_RATES.stitch * videos,
    }),
  );
}
