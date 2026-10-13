import { type Board, type BoardGroup, type BoardNode } from "./schema";

/** World units. A tile matches `w-42 h-35` at zoom 1. */
export const TILE_W = 168;
export const TILE_H = 140;
export const TILE_GAP = 12;
export const GROUP_PAD = 16;
export const GROUP_HEADER = 32;

export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

export type PageLayout = {
  readonly groups: ReadonlyMap<string, Rect>;
  readonly nodes: ReadonlyMap<string, Rect>;
  readonly bounds: Rect | null;
};

export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y,
  };
}

/**
 * Places every group and tile on one page. Tiles in a group fill its grid
 * from the top-left; a group grows to hold its tiles and any nested groups.
 */
export function layoutPage(board: Board, pageId: string): PageLayout {
  const groups = board.groups.filter((group) => group.pageId === pageId);
  const nodes = board.nodes.filter((node) => node.pageId === pageId);
  const groupRects = new Map<string, Rect>();
  const nodeRects = new Map<string, Rect>();

  const tilesOf = (groupId: string): BoardNode[] => nodes.filter((n) => n.groupId === groupId);
  const childrenOf = (groupId: string): BoardGroup[] =>
    groups.filter((g) => g.parentId === groupId);

  const place = (group: BoardGroup, seen: ReadonlySet<string>): Rect => {
    const cached = groupRects.get(group.id);
    if (cached) return cached;
    const originX = group.x + GROUP_PAD;
    const originY = group.y + GROUP_HEADER;
    let rect: Rect = {
      x: group.x,
      y: group.y,
      w: 2 * GROUP_PAD + TILE_W,
      h: GROUP_HEADER + GROUP_PAD,
    };

    tilesOf(group.id).forEach((node, index) => {
      const column = index % group.columns;
      const row = Math.floor(index / group.columns);
      const tile: Rect = {
        x: originX + column * (TILE_W + TILE_GAP),
        y: originY + row * (TILE_H + TILE_GAP),
        w: TILE_W,
        h: TILE_H,
      };
      nodeRects.set(node.id, tile);
      rect = union(rect, { ...tile, w: tile.w + GROUP_PAD, h: tile.h + GROUP_PAD });
    });

    for (const child of childrenOf(group.id)) {
      // A cycle in the data would recurse forever; skip it instead.
      if (seen.has(child.id)) continue;
      const inner = place(child, new Set([...seen, child.id]));
      rect = union(rect, { ...inner, w: inner.w + GROUP_PAD, h: inner.h + GROUP_PAD });
    }
    groupRects.set(group.id, rect);
    return rect;
  };

  for (const group of groups) place(group, new Set([group.id]));

  for (const node of nodes) {
    if (node.groupId !== null && groupRects.has(node.groupId)) continue;
    nodeRects.set(node.id, { x: node.x, y: node.y, w: TILE_W, h: TILE_H });
  }

  let bounds: Rect | null = null;
  for (const rect of [...groupRects.values(), ...nodeRects.values()]) {
    bounds = bounds ? union(bounds, rect) : rect;
  }
  return { groups: groupRects, nodes: nodeRects, bounds };
}

/** Nesting depth, so outer groups draw first and inner ones sit on top. */
export function groupDepth(groups: readonly BoardGroup[], group: BoardGroup): number {
  let depth = 0;
  let parentId = group.parentId;
  const seen = new Set([group.id]);
  while (parentId !== null && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = groups.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    depth += 1;
    parentId = parent.parentId;
  }
  return depth;
}
