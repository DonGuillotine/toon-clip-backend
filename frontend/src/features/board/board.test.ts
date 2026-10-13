import { describe, expect, it } from "vitest";

import { actionReason, applyBoardAction } from "./actions";
import {
  GROUP_HEADER,
  GROUP_PAD,
  TILE_GAP,
  TILE_H,
  TILE_W,
  groupDepth,
  layoutPage,
} from "./layout";
import { courtyardBoardFixture as board } from "./mocks";
import { nextSelection } from "./selection-store";
import { clampZoom, fitTo, revealRect, zoomAt, ZOOM_MAX, ZOOM_MIN } from "./viewport";

const nodes = (...ids: string[]) => board.nodes.filter((node) => ids.includes(node.id));
const makeId = (index: number) => `new_${String(index)}`;

describe("layoutPage", () => {
  const layout = layoutPage(board, "pg_gate");

  it("places grouped tiles in the group's grid", () => {
    const first = layout.nodes.get("n_k1");
    const second = layout.nodes.get("n_k2");
    expect(first).toEqual({ x: 440 + GROUP_PAD, y: GROUP_HEADER, w: TILE_W, h: TILE_H });
    expect(second?.x).toBe(440 + GROUP_PAD + TILE_W + TILE_GAP);
  });

  it("grows a parent group to contain its nested group", () => {
    const parent = layout.groups.get("gr_keys");
    const child = layout.groups.get("gr_alts");
    if (!parent || !child) throw new Error("missing groups");
    expect(parent.y + parent.h).toBeGreaterThanOrEqual(child.y + child.h + GROUP_PAD);
    const alts = board.groups.find((g) => g.id === "gr_alts");
    if (!alts) throw new Error("missing group");
    expect(groupDepth(board.groups, alts)).toBe(1);
  });

  it("keeps free nodes at their own position and only lays out one page", () => {
    expect(layout.nodes.get("n_free")).toMatchObject({ x: 1100, y: 380 });
    expect(layout.nodes.has("n_y1")).toBe(false);
  });
});

describe("viewport", () => {
  it("clamps zoom", () => {
    expect(clampZoom(10)).toBe(ZOOM_MAX);
    expect(clampZoom(0)).toBe(ZOOM_MIN);
  });

  it("keeps the anchor point fixed when zooming", () => {
    const view = { x: 10, y: 20, zoom: 1 };
    const next = zoomAt(view, 2, { x: 100, y: 100 });
    // World point under the anchor before and after.
    expect((100 - view.x) / view.zoom).toBeCloseTo((100 - next.x) / next.zoom);
    expect((100 - view.y) / view.zoom).toBeCloseTo((100 - next.y) / next.zoom);
  });

  it("fits bounds centred, never above 1", () => {
    const view = fitTo({ x: 0, y: 0, w: 100, h: 100 }, { w: 500, h: 300 });
    expect(view.zoom).toBe(1);
    expect(view.x).toBe(200);
    const small = fitTo({ x: 0, y: 0, w: 2000, h: 1000 }, { w: 1096, h: 596 });
    expect(small.zoom).toBeCloseTo(0.5);
  });

  it("pans just enough to reveal a rect", () => {
    const view = { x: 0, y: 0, zoom: 1 };
    expect(revealRect(view, { x: 10, y: 50, w: 10, h: 10 }, { w: 200, h: 200 }).x).toBe(14);
    expect(revealRect(view, { x: 50, y: 50, w: 10, h: 10 }, { w: 200, h: 200 })).toBe(view);
  });
});

describe("actionReason", () => {
  it("needs a palette and media to restyle", () => {
    expect(actionReason("restyle", nodes("n_k1"))).not.toBeNull();
    expect(actionReason("restyle", nodes("n_k1", "n_pal"))).toBeNull();
  });

  it("animates two or more images and stitches two or more videos", () => {
    expect(actionReason("animate", nodes("n_k1", "n_k2"))).toBeNull();
    expect(actionReason("animate", nodes("n_k1"))).not.toBeNull();
    expect(actionReason("stitch", nodes("n_c1", "n_c3"))).toBeNull();
  });

  it("uses exactly one image as a frame", () => {
    expect(actionReason("use-first-frame", nodes("n_k1"))).toBeNull();
    expect(actionReason("use-last-frame", nodes("n_k1", "n_k2"))).not.toBeNull();
  });
});

describe("applyBoardAction", () => {
  it("deletes only the selected nodes", () => {
    const { board: next } = applyBoardAction(board, "delete", ["n_k1", "n_note"], makeId);
    expect(next.nodes).toHaveLength(board.nodes.length - 2);
    expect(next.nodes.some((node) => node.id === "n_k1")).toBe(false);
  });

  it("requeues media on regenerate but leaves locked tiles", () => {
    const { board: next } = applyBoardAction(board, "regenerate", ["n_k1", "n_k2"], makeId);
    const byId = new Map(next.nodes.map((node) => [node.id, node]));
    expect(byId.get("n_k1")).toMatchObject({ state: "locked" });
    expect(byId.get("n_k2")).toMatchObject({ state: "queued" });
  });

  it("makes one clip per consecutive pair when animating", () => {
    const { board: next } = applyBoardAction(board, "animate", ["n_k1", "n_k2", "n_k3"], makeId);
    const added = next.nodes.filter((node) => node.id.startsWith("new_"));
    expect(added).toHaveLength(2);
    expect(added[0]).toMatchObject({ kind: "video", state: "queued", groupId: "gr_keys" });
  });

  it("stitches videos into one with the summed duration", () => {
    const { board: next } = applyBoardAction(board, "stitch", ["n_c1", "n_c3"], makeId);
    expect(next.nodes.find((node) => node.id === "new_0")).toMatchObject({ durationSec: 14 });
  });

  it("links videos sent to the timeline", () => {
    const { board: next } = applyBoardAction(board, "send-to-timeline", ["n_c2"], makeId);
    expect(next.nodes.find((node) => node.id === "n_c2")).toMatchObject({ usedInTimeline: true });
  });
});

describe("nextSelection", () => {
  it("replaces on click and toggles on shift-click", () => {
    expect(nextSelection(["a"], "b", false)).toEqual(["b"]);
    expect(nextSelection(["a"], "a", false)).toEqual([]);
    expect(nextSelection(["a"], "b", true)).toEqual(["a", "b"]);
    expect(nextSelection(["a", "b"], "a", true)).toEqual(["b"]);
  });
});
