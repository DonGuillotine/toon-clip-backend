import { describe, expect, it } from "vitest";

import { LAYOUTS, panelCount, slotArea } from "./layouts";
import { comicPagesFixture } from "./mocks";
import {
  advanceComicExport,
  applyComicAction,
  clampPercent,
  completePanel,
  type ComicExportRecord,
  EXPORT_PREPARE_MS,
  EXPORT_RENDER_MS,
  exportBlocker,
  hasActiveWork,
  moveItem,
  newPage,
  nudge,
  PANEL_GENERATING_MS,
  PANEL_QUEUED_MS,
  panelJobStatus,
  progressPanel,
  queuePanel,
  summarisePage,
} from "./page";
import { COMIC_LAYOUTS, type ComicPage, ComicPageSchema, type PanelTake } from "./schema";

const blank = (layout: (typeof COMIC_LAYOUTS)[number] = "grid-four"): ComicPage =>
  newPage(
    "cp_test",
    "  Test page  ",
    layout,
    new Date("2026-01-01T00:00:00Z"),
    (index) => `p${String(index + 1)}`,
  );

function expectOk(result: ReturnType<typeof applyComicAction>): ComicPage {
  if (!result.ok) throw new Error(`Expected ok, got: ${result.reason}`);
  return ComicPageSchema.parse(result.page);
}

const take: PanelTake = {
  id: "t1",
  number: 1,
  prompt: "Kaito runs",
  credits: 40,
  createdAt: "2026-01-01T00:00:00.000Z",
  art: "rush",
};

describe("layouts", () => {
  it("covers 1 to 6 panels and every template tiles the 6 by 6 grid", () => {
    const counts = COMIC_LAYOUTS.map(panelCount);
    expect(Math.min(...counts)).toBe(1);
    expect(Math.max(...counts)).toBe(6);
    for (const layout of COMIC_LAYOUTS) {
      const area = LAYOUTS[layout].slots.reduce((sum, slot) => sum + slotArea(slot), 0);
      expect(area, layout).toBe(36);
    }
  });

  it("makes one empty panel per slot", () => {
    const page = blank("five-beat");
    expect(page.title).toBe("Test page");
    expect(page.panels).toHaveLength(5);
    expect(page.panels.every((panel) => panel.state === "empty")).toBe(true);
  });
});

describe("fixtures", () => {
  it("parse against the contract", () => {
    for (const page of comicPagesFixture) expect(() => ComicPageSchema.parse(page)).not.toThrow();
  });
});

describe("bubbles", () => {
  it("adds, edits, moves and deletes", () => {
    let page = expectOk(
      applyComicAction(blank(), {
        type: "addBubble",
        panelId: "p1",
        bubbleId: "b1",
        kind: "speech",
        text: "Hi",
      }),
    );
    expect(page.panels[0]?.bubbles).toHaveLength(1);

    page = expectOk(
      applyComicAction(page, {
        type: "editBubble",
        panelId: "p1",
        bubbleId: "b1",
        kind: "thought",
        text: "Hmm",
      }),
    );
    expect(page.panels[0]?.bubbles[0]).toMatchObject({ kind: "thought", text: "Hmm" });

    page = expectOk(
      applyComicAction(page, { type: "moveBubble", panelId: "p1", bubbleId: "b1", x: 140, y: -3 }),
    );
    expect(page.panels[0]?.bubbles[0]).toMatchObject({ x: 100, y: 0 });

    page = expectOk(
      applyComicAction(page, { type: "deleteBubble", panelId: "p1", bubbleId: "b1" }),
    );
    expect(page.panels[0]?.bubbles).toHaveLength(0);
  });

  it("refuses a duplicate id and an unknown bubble", () => {
    const add = {
      type: "addBubble",
      panelId: "p1",
      bubbleId: "b1",
      kind: "caption",
      text: "",
    } satisfies Parameters<typeof applyComicAction>[1];
    const page = expectOk(applyComicAction(blank(), add));
    expect(applyComicAction(page, add).ok).toBe(false);
    expect(
      applyComicAction(page, { type: "deleteBubble", panelId: "p1", bubbleId: "nope" }).ok,
    ).toBe(false);
  });

  it("nudges with arrow keys and stays on the panel", () => {
    expect(nudge({ x: 50, y: 50 }, "ArrowLeft", false)).toEqual({ x: 48, y: 50 });
    expect(nudge({ x: 50, y: 50 }, "ArrowDown", true)).toEqual({ x: 50, y: 60 });
    expect(nudge({ x: 1, y: 50 }, "ArrowLeft", true)).toEqual({ x: 0, y: 50 });
    expect(nudge({ x: 1, y: 50 }, "Enter", false)).toBeNull();
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});

describe("panel order", () => {
  it("moves a panel and keeps the rest in order", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    const page = expectOk(
      applyComicAction(blank(), { type: "movePanel", panelId: "p4", toIndex: 0 }),
    );
    expect(page.panels.map((panel) => panel.id)).toEqual(["p4", "p1", "p2", "p3"]);
    expect(applyComicAction(blank(), { type: "movePanel", panelId: "p1", toIndex: 9 }).ok).toBe(
      false,
    );
  });
});

describe("generation", () => {
  const withPrompt = expectOk(
    applyComicAction(blank(), { type: "setPrompt", panelId: "p1", prompt: "Kaito runs" }),
  );

  it("will not queue an empty prompt or a busy panel", () => {
    expect(queuePanel(blank(), "p1", "j1").ok).toBe(false);
    const queued = expectOk(queuePanel(withPrompt, "p1", "j1"));
    expect(queuePanel(queued, "p1", "j2").ok).toBe(false);
    expect(applyComicAction(queued, { type: "setPrompt", panelId: "p1", prompt: "x" }).ok).toBe(
      false,
    );
    expect(hasActiveWork(queued)).toBe(true);
  });

  it("moves through queued, generating and done on the clock", () => {
    expect(panelJobStatus(0, 0)).toEqual({ status: "queued" });
    expect(panelJobStatus(0, PANEL_QUEUED_MS + PANEL_GENERATING_MS / 2)).toEqual({
      status: "generating",
      progress: 50,
    });
    expect(panelJobStatus(0, PANEL_QUEUED_MS + PANEL_GENERATING_MS)).toEqual({ status: "done" });
  });

  it("keeps every take and selects the newest", () => {
    const queued = expectOk(queuePanel(withPrompt, "p1", "j1"));
    const running = progressPanel(queued, "p1", "j1", 40);
    expect(running.panels[0]).toMatchObject({ state: "generating", progress: 40 });
    const done = completePanel(running, "p1", "j1", { ok: true, take });
    expect(done.panels[0]).toMatchObject({ state: "ready", selectedTakeId: "t1" });

    const again = completePanel(expectOk(queuePanel(done, "p1", "j2")), "p1", "j2", {
      ok: true,
      take: { ...take, id: "t2", number: 2 },
    });
    expect(again.panels[0]?.takes).toHaveLength(2);
    expect(again.panels[0]?.selectedTakeId).toBe("t2");

    const back = expectOk(
      applyComicAction(again, { type: "selectTake", panelId: "p1", takeId: "t1" }),
    );
    expect(back.panels[0]?.selectedTakeId).toBe("t1");
  });

  it("fails with a reason and keeps older takes; a stale job changes nothing", () => {
    const done = completePanel(expectOk(queuePanel(withPrompt, "p1", "j1")), "p1", "j1", {
      ok: true,
      take,
    });
    const failed = completePanel(expectOk(queuePanel(done, "p1", "j2")), "p1", "j2", {
      ok: false,
      reason: "Timed out.",
    });
    expect(failed.panels[0]).toMatchObject({ state: "failed", reason: "Timed out." });
    expect(failed.panels[0]?.selectedTakeId).toBe("t1");
    expect(completePanel(failed, "p1", "j9", { ok: true, take })).toEqual(failed);
  });
});

describe("export", () => {
  const record: ComicExportRecord = {
    id: "ex1",
    pageId: "cp_test",
    format: "psd",
    summary: "Layered PSD",
    fileName: "test-page.psd",
    startedAt: 0,
    failWith: null,
  };

  it("moves from preparing to rendering to ready with a 7 day link", () => {
    expect(advanceComicExport(record, 0).status).toBe("preparing");
    expect(advanceComicExport(record, EXPORT_PREPARE_MS + EXPORT_RENDER_MS / 2)).toMatchObject({
      status: "rendering",
      progress: 50,
    });
    const ready = advanceComicExport(record, EXPORT_PREPARE_MS + EXPORT_RENDER_MS);
    expect(ready).toMatchObject({
      status: "ready",
      downloadUrl: "/api/comics/cp_test/exports/ex1/download",
    });
  });

  it("fails with the blocker when a panel has no take", () => {
    const reason = exportBlocker(blank());
    expect(reason).toContain("Panel 1");
    expect(
      advanceComicExport({ ...record, failWith: reason }, EXPORT_PREPARE_MS + EXPORT_RENDER_MS),
    ).toMatchObject({ status: "failed", reason });
  });

  it("summarises a page for the list", () => {
    const summary = summarisePage(blank());
    expect(summary).toMatchObject({ panelCount: 4, readyCount: 0, bubbleCount: 0, cover: null });
  });
});
