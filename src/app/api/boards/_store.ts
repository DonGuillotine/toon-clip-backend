import { courtyardBoardFixture, emptyBoardFixture } from "@/features/board/mocks";
import { type Board } from "@/features/board/schema";
import { recentStoryboardsFixture } from "@/features/storyboards/mocks";

/**
 * In-memory fixture store, so mutations persist for the life of the dev
 * server. Replaced by backend calls when the board API lands.
 */
const boards = new Map<string, Board>([
  [courtyardBoardFixture.storyboardId, courtyardBoardFixture],
]);

export function readBoard(storyboardId: string): Board | null {
  const existing = boards.get(storyboardId);
  if (existing) return existing;
  const storyboard = recentStoryboardsFixture.find((item) => item.id === storyboardId);
  if (!storyboard) return null;
  const fresh = emptyBoardFixture(storyboard.id, storyboard.title);
  boards.set(storyboardId, fresh);
  return fresh;
}

export function writeBoard(board: Board): void {
  boards.set(board.storyboardId, board);
}

let counter = 0;
export function nextNodeId(): string {
  counter += 1;
  return `n_new_${String(counter)}`;
}
