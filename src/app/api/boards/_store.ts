import { courtyardBoardFixture, emptyBoardFixture } from "@/features/board/mocks";
import { type Board } from "@/features/board/schema";
import { recentStoryboardsFixture } from "@/features/storyboards/mocks";

/**
 * In-memory fixture store, so mutations persist for the life of the dev
 * server. Replaced by backend calls when the board API lands.
 */
type Store = { readonly boards: Map<string, Board>; counter: number };

/** On `globalThis`, so every board route bundle shares one store. */
const scope: typeof globalThis & { toonClipBoardStore?: Store } = globalThis;

function store(): Store {
  scope.toonClipBoardStore ??= {
    boards: new Map([[courtyardBoardFixture.storyboardId, courtyardBoardFixture]]),
    counter: 0,
  };
  return scope.toonClipBoardStore;
}

export function readBoard(storyboardId: string): Board | null {
  const { boards } = store();
  const existing = boards.get(storyboardId);
  if (existing) return existing;
  const storyboard = recentStoryboardsFixture.find((item) => item.id === storyboardId);
  if (!storyboard) return null;
  const fresh = emptyBoardFixture(storyboard.id, storyboard.title);
  boards.set(storyboardId, fresh);
  return fresh;
}

export function writeBoard(board: Board): void {
  store().boards.set(board.storyboardId, board);
}

export function nextNodeId(): string {
  const current = store();
  current.counter += 1;
  return `n_new_${String(current.counter)}`;
}
