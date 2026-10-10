import { panelCount } from "./layouts";
import {
  type Bubble,
  type BubbleKind,
  type ComicAction,
  type ComicExport,
  type ComicExportFormat,
  type ComicExportRequest,
  type ComicLayout,
  type ComicPage,
  type ComicSummary,
  type Panel,
  type PanelTake,
} from "./schema";

/**
 * Pure page logic. The fixture API applies it to its store and the client
 * applies it for optimistic updates, so both always agree on what an edit does.
 */

export type PageResult =
  { readonly ok: true; readonly page: ComicPage } | { readonly ok: false; readonly reason: string };

const fail = (reason: string): PageResult => ({ ok: false, reason });

/** Where a new bubble lands, per kind: captions sit top-start, speech high, thought higher. */
export const BUBBLE_DEFAULTS = {
  speech: { x: 12, y: 14, text: "Say something." },
  thought: { x: 52, y: 8, text: "Thinking..." },
  caption: { x: 4, y: 4, text: "Meanwhile..." },
} satisfies Record<BubbleKind, { x: number; y: number; text: string }>;

/** Keeps a bubble's anchor on the panel, so it can never be dragged off. */
export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export type Point = { readonly x: number; readonly y: number };

/** Arrow keys nudge a bubble by this much, Shift plus an arrow by the larger step. */
const NUDGE = 2;
const NUDGE_LARGE = 10;

/** Where an arrow key moves a point, or `null` for any other key. */
export function nudge(point: Point, key: string, large: boolean): Point | null {
  const step = large ? NUDGE_LARGE : NUDGE;
  switch (key) {
    case "ArrowLeft":
      return { x: clampPercent(point.x - step), y: point.y };
    case "ArrowRight":
      return { x: clampPercent(point.x + step), y: point.y };
    case "ArrowUp":
      return { x: point.x, y: clampPercent(point.y - step) };
    case "ArrowDown":
      return { x: point.x, y: clampPercent(point.y + step) };
    default:
      return null;
  }
}

export type BusyPanel = Extract<Panel, { state: "queued" | "generating" }>;

export function isBusy(panel: Panel): panel is BusyPanel {
  return panel.state === "queued" || panel.state === "generating";
}

/** The selected take, or `null` while a panel has none. */
export function selectedTake(panel: Panel): PanelTake | null {
  return panel.takes.find((take) => take.id === panel.selectedTakeId) ?? null;
}

/** Copy a panel with new shared fields, keeping its state variant intact. */
function withFields(
  panel: Panel,
  fields: Partial<Pick<Panel, "prompt" | "takes" | "selectedTakeId" | "bubbles">>,
): Panel {
  return { ...panel, ...fields };
}

function updatePanel(
  page: ComicPage,
  panelId: string,
  change: (panel: Panel) => Panel | string,
): PageResult {
  const index = page.panels.findIndex((panel) => panel.id === panelId);
  const panel = page.panels[index];
  if (!panel) return fail("That panel is not on this page.");
  const next = change(panel);
  if (typeof next === "string") return fail(next);
  const panels = page.panels.map((item, at) => (at === index ? next : item));
  return { ok: true, page: { ...page, panels } };
}

function updateBubble(
  page: ComicPage,
  panelId: string,
  bubbleId: string,
  change: (bubble: Bubble) => Bubble | null,
): PageResult {
  return updatePanel(page, panelId, (panel) => {
    if (!panel.bubbles.some((bubble) => bubble.id === bubbleId)) {
      return "That bubble is not on this panel any more.";
    }
    const bubbles = panel.bubbles.flatMap((bubble) => {
      if (bubble.id !== bubbleId) return [bubble];
      const next = change(bubble);
      return next === null ? [] : [next];
    });
    return withFields(panel, { bubbles });
  });
}

/** Move one item in a list to a new index, clamped to the list. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const list = [...items];
  const [item] = list.splice(from, 1);
  if (item === undefined) return list;
  const target = Math.min(Math.max(0, to), list.length);
  list.splice(target, 0, item);
  return list;
}

/** Apply a free edit. Nothing here costs credits. */
export function applyComicAction(page: ComicPage, action: ComicAction): PageResult {
  switch (action.type) {
    case "rename":
      return { ok: true, page: { ...page, title: action.title.trim() } };

    case "setPrompt":
      return updatePanel(page, action.panelId, (panel) =>
        isBusy(panel)
          ? "This panel is generating. Change the prompt once it finishes."
          : withFields(panel, { prompt: action.prompt }),
      );

    case "selectTake":
      return updatePanel(page, action.panelId, (panel) =>
        panel.takes.some((take) => take.id === action.takeId)
          ? withFields(panel, { selectedTakeId: action.takeId })
          : "That take is not in this panel's history.",
      );

    case "movePanel": {
      const from = page.panels.findIndex((panel) => panel.id === action.panelId);
      if (from === -1) return fail("That panel is not on this page.");
      if (action.toIndex >= page.panels.length) return fail("A panel cannot move past the end.");
      return { ok: true, page: { ...page, panels: moveItem(page.panels, from, action.toIndex) } };
    }

    case "addBubble":
      return updatePanel(page, action.panelId, (panel) => {
        if (panel.bubbles.some((bubble) => bubble.id === action.bubbleId)) {
          return "That bubble already exists.";
        }
        const spot = BUBBLE_DEFAULTS[action.kind];
        // Stagger repeat bubbles so they do not stack exactly on top of each other.
        const offset = (panel.bubbles.length % 4) * 8;
        const bubble: Bubble = {
          id: action.bubbleId,
          kind: action.kind,
          text: action.text,
          x: clampPercent(spot.x + offset),
          y: clampPercent(spot.y + offset),
        };
        return withFields(panel, { bubbles: [...panel.bubbles, bubble] });
      });

    case "editBubble":
      return updateBubble(page, action.panelId, action.bubbleId, (bubble) => ({
        ...bubble,
        kind: action.kind,
        text: action.text,
      }));

    case "moveBubble":
      return updateBubble(page, action.panelId, action.bubbleId, (bubble) => ({
        ...bubble,
        x: clampPercent(action.x),
        y: clampPercent(action.y),
      }));

    case "deleteBubble":
      return updateBubble(page, action.panelId, action.bubbleId, () => null);
  }
}

/* ------------------------------------------------------------------------ */
/* Panel generation.                                                         */
/* ------------------------------------------------------------------------ */

/** Simulated job timing, in milliseconds. */
export const PANEL_QUEUED_MS = 1_500;
export const PANEL_GENERATING_MS = 6_000;

export type PanelJobStatus =
  | { readonly status: "queued" }
  | { readonly status: "generating"; readonly progress: number }
  | { readonly status: "done" };

/** Where a panel job is at `now`. */
export function panelJobStatus(startedAt: number, now: number): PanelJobStatus {
  const elapsed = now - startedAt;
  if (elapsed < PANEL_QUEUED_MS) return { status: "queued" };
  if (elapsed < PANEL_QUEUED_MS + PANEL_GENERATING_MS) {
    const progress = Math.round(((elapsed - PANEL_QUEUED_MS) / PANEL_GENERATING_MS) * 100);
    return { status: "generating", progress };
  }
  return { status: "done" };
}

/** Queue a generation for one panel. Older takes are kept. */
export function queuePanel(page: ComicPage, panelId: string, jobId: string): PageResult {
  return updatePanel(page, panelId, (panel): Panel | string => {
    if (isBusy(panel)) return "This panel is already generating.";
    if (panel.prompt.trim() === "") return "Describe the panel before generating it.";
    const { id, prompt, takes, selectedTakeId, bubbles } = panel;
    return { id, prompt, takes, selectedTakeId, bubbles, state: "queued", jobId };
  });
}

/** Move a running job's progress forward. A panel not on this job is left alone. */
export function progressPanel(
  page: ComicPage,
  panelId: string,
  jobId: string,
  progress: number,
): ComicPage {
  const result = updatePanel(page, panelId, (panel): Panel => {
    if (!isBusy(panel) || panel.jobId !== jobId) return panel;
    const { id, prompt, takes, selectedTakeId, bubbles } = panel;
    return { id, prompt, takes, selectedTakeId, bubbles, state: "generating", jobId, progress };
  });
  return result.ok ? result.page : page;
}

export type PanelOutcome =
  { readonly ok: true; readonly take: PanelTake } | { readonly ok: false; readonly reason: string };

/** Settle a job: a new selected take on success, a reason on failure. */
export function completePanel(
  page: ComicPage,
  panelId: string,
  jobId: string,
  outcome: PanelOutcome,
): ComicPage {
  const result = updatePanel(page, panelId, (panel): Panel => {
    if (!isBusy(panel) || panel.jobId !== jobId) return panel;
    const { id, prompt, takes, selectedTakeId, bubbles } = panel;
    if (!outcome.ok) {
      return {
        id,
        prompt,
        takes,
        selectedTakeId,
        bubbles,
        state: "failed",
        reason: outcome.reason,
      };
    }
    return {
      id,
      prompt,
      takes: [...takes, outcome.take],
      selectedTakeId: outcome.take.id,
      bubbles,
      state: "ready",
    };
  });
  return result.ok ? result.page : page;
}

/* ------------------------------------------------------------------------ */
/* Pages and exports.                                                        */
/* ------------------------------------------------------------------------ */

/** A fresh page from a template: one empty panel per slot. */
export function newPage(
  id: string,
  title: string,
  layout: ComicLayout,
  now: Date,
  panelId: (index: number) => string,
): ComicPage {
  const panels = Array.from({ length: panelCount(layout) }, (_, index): Panel => ({
    id: panelId(index),
    prompt: "",
    takes: [],
    selectedTakeId: null,
    bubbles: [],
    state: "empty",
  }));
  return { id, title: title.trim(), layout, updatedAt: now.toISOString(), panels, exports: [] };
}

export function summarisePage(page: ComicPage): ComicSummary {
  const first = page.panels[0];
  return {
    id: page.id,
    title: page.title,
    layout: page.layout,
    updatedAt: page.updatedAt,
    panelCount: page.panels.length,
    readyCount: page.panels.filter((panel) => selectedTake(panel) !== null).length,
    bubbleCount: page.panels.reduce((sum, panel) => sum + panel.bubbles.length, 0),
    cover: first ? (selectedTake(first)?.art ?? null) : null,
  };
}

/** Why a page cannot be exported yet, or `null` when every panel has a take. */
export function exportBlocker(page: ComicPage): string | null {
  const index = page.panels.findIndex((panel) => selectedTake(panel) === null);
  if (index === -1) return null;
  return `Panel ${String(index + 1)} has no take yet, so the page could not be built. Generate it, then try again.`;
}

export const EXPORT_PREPARE_MS = 2_000;
export const EXPORT_RENDER_MS = 6_000;
export const EXPORT_LINK_MS = 7 * 24 * 60 * 60 * 1000;

export type ComicExportRecord = {
  readonly id: string;
  readonly pageId: string;
  readonly format: ComicExportFormat;
  readonly summary: string;
  readonly fileName: string;
  /** When the current attempt started, in ms. A retry resets it. */
  readonly startedAt: number;
  /** Set when this attempt is going to fail, with the reason the API gives. */
  readonly failWith: string | null;
};

/** Where an export is at `now`. */
export function advanceComicExport(record: ComicExportRecord, now: number): ComicExport {
  const base = {
    id: record.id,
    format: record.format,
    summary: record.summary,
    createdAt: new Date(record.startedAt).toISOString(),
  };
  const elapsed = now - record.startedAt;
  if (elapsed < EXPORT_PREPARE_MS) return { ...base, status: "preparing" };
  if (elapsed < EXPORT_PREPARE_MS + EXPORT_RENDER_MS) {
    const progress = Math.round(((elapsed - EXPORT_PREPARE_MS) / EXPORT_RENDER_MS) * 100);
    return { ...base, status: "rendering", progress };
  }
  if (record.failWith !== null) return { ...base, status: "failed", reason: record.failWith };
  return {
    ...base,
    status: "ready",
    downloadUrl: `/api/comics/${record.pageId}/exports/${record.id}/download`,
    fileName: record.fileName,
    expiresAt: new Date(
      record.startedAt + EXPORT_PREPARE_MS + EXPORT_RENDER_MS + EXPORT_LINK_MS,
    ).toISOString(),
  };
}

export function slug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base === "" ? "comic-page" : base;
}

/** The one-line summary the API writes for an export. */
export function summariseExport(request: ComicExportRequest): string {
  if (request.format === "png") return "Flat PNG, bubbles lettered in";
  const bubbles = request.bubblesAsText ? "bubbles as text layers" : "bubbles flattened";
  const background = request.separateBackground
    ? "background separate"
    : "background with character";
  return `Layered PSD, one folder per panel, ${bubbles}, ${background}`;
}

export function exportFileName(title: string, format: ComicExportFormat): string {
  return `${slug(title)}.${format}`;
}

export function hasActiveWork(page: ComicPage): boolean {
  return (
    page.panels.some(isBusy) ||
    page.exports.some((job) => job.status === "preparing" || job.status === "rendering")
  );
}
