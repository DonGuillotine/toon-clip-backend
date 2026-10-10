import { isMedia } from "@/features/board/actions";
import { BOARD_RATES } from "@/features/board/mocks";
import { type Board, type BoardQuote, BoardQuoteSchema } from "@/features/board/schema";

/**
 * The fixture price list for board actions. The quote endpoint shows it and
 * the actions endpoint charges it, so the cost shown is the cost spent.
 */
export function boardQuote(board: Board, nodeIds: readonly string[]): BoardQuote {
  const ids = new Set(nodeIds);
  const selected = board.nodes.filter((node) => ids.has(node.id));
  const media = selected.filter(isMedia);
  const images = selected.filter((node) => node.kind === "image").length;
  const videos = selected.filter((node) => node.kind === "video").length;

  return BoardQuoteSchema.parse({
    regenerate: BOARD_RATES.regenerate * media.filter((node) => node.state !== "locked").length,
    restyle: BOARD_RATES.restyle * media.length,
    animate: BOARD_RATES.animate * Math.max(images - 1, 0),
    stitch: BOARD_RATES.stitch * videos,
  });
}
