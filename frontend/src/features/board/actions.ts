import { type Board, type BoardAction, type BoardNode, type MediaNode } from "./schema";

/** Every toolbar action, including the two the client handles alone. */
export type ToolbarAction = BoardAction | "compare" | "download";

export function isMedia(node: BoardNode): node is MediaNode {
  return node.kind === "image" || node.kind === "video";
}

function countKind(nodes: readonly BoardNode[], kind: BoardNode["kind"]): number {
  return nodes.filter((node) => node.kind === kind).length;
}

/**
 * Whether an action makes sense for a selection. Disabled actions stay
 * visible with a reason, so the toolbar never jumps around.
 */
export function actionReason(action: ToolbarAction, selected: readonly BoardNode[]): string | null {
  const media = selected.filter(isMedia).length;
  const images = countKind(selected, "image");
  const videos = countKind(selected, "video");
  const palettes = countKind(selected, "palette");

  switch (action) {
    case "regenerate":
    case "download":
      return media > 0 ? null : "Select an image or video";
    case "restyle":
      return palettes === 1 && media > 0 ? null : "Select one palette and the tiles to restyle";
    case "animate":
      return images >= 2 ? null : "Select two or more images in order";
    case "use-first-frame":
    case "use-last-frame":
      return images === 1 && selected.length === 1 ? null : "Select exactly one image";
    case "stitch":
      return videos >= 2 ? null : "Select two or more videos";
    case "send-to-timeline":
      return videos > 0 ? null : "Select a video";
    case "compare":
      return media >= 2 && media <= 4 ? null : "Select two to four images or videos";
    case "delete":
      return selected.length > 0 ? null : "Select something";
  }
}

/** Ordered as tiles read on the board: by group, then by position in it. */
export function inBoardOrder(board: Board, ids: readonly string[]): BoardNode[] {
  const wanted = new Set(ids);
  return board.nodes.filter((node) => wanted.has(node.id));
}

type ActionOutcome = { readonly board: Board; readonly message: string };

/**
 * Applies an action to a board. Pure, so the route handler uses it as the
 * fixture backend and the client uses it for the optimistic update.
 * `makeId` names new nodes: the server issues real ids, the client temporary ones.
 */
export function applyBoardAction(
  board: Board,
  action: BoardAction,
  nodeIds: readonly string[],
  makeId: (index: number) => string,
): ActionOutcome {
  const selected = inBoardOrder(board, nodeIds);
  const ids = new Set(selected.map((node) => node.id));
  const media = selected.filter(isMedia);
  const plural = (count: number, word: string) =>
    `${String(count)} ${word}${count === 1 ? "" : "s"}`;

  const requeue = (predicate: (node: MediaNode) => boolean): Board => ({
    ...board,
    nodes: board.nodes.map((node) =>
      isMedia(node) && ids.has(node.id) && predicate(node) ? { ...node, state: "queued" } : node,
    ),
  });

  switch (action) {
    case "delete": {
      return {
        board: { ...board, nodes: board.nodes.filter((node) => !ids.has(node.id)) },
        message: `Deleted ${plural(selected.length, "item")} from the board.`,
      };
    }
    case "regenerate": {
      return {
        board: requeue((node) => node.state !== "locked"),
        message: `Queued a new take for ${plural(media.filter((n) => n.state !== "locked").length, "tile")}. Locked tiles were left alone.`,
      };
    }
    case "restyle": {
      return {
        board: requeue((node) => node.state !== "locked"),
        message: `Restyling ${plural(media.length, "tile")} to the palette.`,
      };
    }
    case "send-to-timeline": {
      return {
        board: {
          ...board,
          nodes: board.nodes.map((node) =>
            node.kind === "video" && ids.has(node.id) ? { ...node, usedInTimeline: true } : node,
          ),
        },
        message: `Sent ${plural(media.filter((n) => n.kind === "video").length, "video")} to the timeline.`,
      };
    }
    case "use-first-frame":
    case "use-last-frame": {
      const which = action === "use-first-frame" ? "first" : "last";
      return { board, message: `Kept as the ${which} frame for your next generation.` };
    }
    case "animate": {
      const images = selected.filter((node) => node.kind === "image");
      const first = images[0];
      if (!first) return { board, message: "Nothing to animate." };
      const clips: BoardNode[] = images.slice(1).map((last, index) => ({
        id: makeId(index),
        kind: "video",
        pageId: first.pageId,
        groupId: first.groupId,
        x: first.x,
        y: first.y,
        label: `${first.label} to ${last.label}`,
        usedInTimeline: false,
        art: first.art,
        state: "queued",
        durationSec: 5,
      }));
      return {
        board: { ...board, nodes: [...board.nodes, ...clips] },
        message: `Queued ${plural(clips.length, "clip")} between consecutive frames.`,
      };
    }
    case "stitch": {
      const videos = selected.filter((node) => node.kind === "video");
      const first = videos[0];
      if (!first) return { board, message: "Nothing to stitch." };
      const stitched: BoardNode = {
        id: makeId(0),
        kind: "video",
        pageId: first.pageId,
        groupId: first.groupId,
        x: first.x,
        y: first.y,
        label: `Stitch of ${plural(videos.length, "clip")}`,
        usedInTimeline: false,
        art: first.art,
        state: "queued",
        durationSec: videos.reduce((total, video) => total + video.durationSec, 0),
      };
      return {
        board: { ...board, nodes: [...board.nodes, stitched] },
        message: `Stitching ${plural(videos.length, "clip")} into one.`,
      };
    }
  }
}
