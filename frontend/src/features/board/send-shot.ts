import { type StoryboardDetail } from "@/features/storyboards/schema";
import { placeShots, selectedTake } from "@/features/storyboards/timeline";

import { layoutPage } from "./layout";
import { type Board, type BoardGroup, type BoardNode, type SendShotRequest } from "./schema";

/** The group on a board's first page that holds shots sent from the timeline. */
export const TIMELINE_GROUP_ID = "g_from_timeline";
const GROUP_GAP = 64;
const SENT_PREFIX = "n_tl_";

/** The node id a sent shot gets, so sending the same shot twice is a no-op. */
export const sentNodeId = (shotId: string): string => `${SENT_PREFIX}${shotId}`;

/**
 * Put a timeline shot on the board as a video node with a link badge: board
 * and timeline share the media, nothing is copied (spec 7.6). The node goes
 * into a "From the timeline" group, made on first use to the right of
 * everything else on the first page.
 */
export function sendShotToBoard(
  board: Board,
  input: SendShotRequest,
): { readonly board: Board; readonly message: string } {
  const page = board.pages[0];
  if (!page) return { board, message: "This board has no page to put the shot on." };

  const nodeId = sentNodeId(input.shotId);
  if (board.nodes.some((node) => node.id === nodeId)) {
    return { board, message: `${input.label} is already on the board.` };
  }

  let groups = board.groups;
  if (!groups.some((group) => group.id === TIMELINE_GROUP_ID)) {
    const bounds = layoutPage(board, page.id).bounds;
    const group: BoardGroup = {
      id: TIMELINE_GROUP_ID,
      pageId: page.id,
      parentId: null,
      title: "From the timeline",
      x: bounds === null ? 0 : bounds.x + bounds.w + GROUP_GAP,
      y: bounds === null ? 0 : bounds.y,
      columns: 2,
    };
    groups = [...groups, group];
  }

  const node: BoardNode = {
    id: nodeId,
    kind: "video",
    pageId: page.id,
    groupId: TIMELINE_GROUP_ID,
    x: 0,
    y: 0,
    label: input.label,
    usedInTimeline: true,
    art: input.art,
    state: input.state,
    durationSec: input.durationSec,
  };

  return {
    board: { ...board, groups, nodes: [...board.nodes, node] },
    message: `Sent ${input.label} to the board, in "From the timeline".`,
  };
}

/**
 * Board and timeline share media (spec 7.6): a shot sent to the board shows
 * the take the timeline has selected now, so choosing another take on the
 * timeline updates the tile. Nodes not sent from the timeline are untouched.
 */
export function syncTimelineNodes(board: Board, detail: StoryboardDetail): Board {
  const shots = new Map(placeShots(detail).map((placed) => [placed.shot.id, placed.shot]));
  const nodes = board.nodes.map((node): BoardNode => {
    if (node.kind !== "video" || !node.id.startsWith(SENT_PREFIX)) return node;
    const shot = shots.get(node.id.slice(SENT_PREFIX.length));
    if (!shot) return node;
    const art = selectedTake(shot)?.art ?? node.art;
    if (art === node.art && shot.state === node.state && shot.durationSec === node.durationSec) {
      return node;
    }
    return { ...node, art, state: shot.state, durationSec: shot.durationSec };
  });
  const changed = nodes.some((node, index) => node !== board.nodes[index]);
  return changed ? { ...board, nodes } : board;
}
