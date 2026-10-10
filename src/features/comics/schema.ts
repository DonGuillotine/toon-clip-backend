import { z } from "zod";

import { CoverArtSchema } from "@/features/storyboards/schema";

/* ------------------------------------------------------------------------ */
/* Page templates (spec 15, "Comic mode layout": 1 to 6 panels).             */
/* ------------------------------------------------------------------------ */

export const ComicLayoutSchema = z.enum([
  "splash",
  "two-tier",
  "three-tier",
  "feature-three",
  "grid-four",
  "five-beat",
  "grid-six",
]);
export const COMIC_LAYOUTS = ComicLayoutSchema.options;
export type ComicLayout = z.infer<typeof ComicLayoutSchema>;

/* ------------------------------------------------------------------------ */
/* Speech bubbles: editable text placed on a panel.                          */
/* ------------------------------------------------------------------------ */

export const BubbleKindSchema = z.enum(["speech", "thought", "caption"]);
export const BUBBLE_KINDS = BubbleKindSchema.options;
export type BubbleKind = z.infer<typeof BubbleKindSchema>;

/** Bubble position as a percentage of the panel, from the start and top edges. */
export const PercentSchema = z.number().min(0).max(100);

export const BUBBLE_TEXT_MAX = 280;

// CONTRACT: unconfirmed. One bubble on a panel.
export const BubbleSchema = z.object({
  id: z.string().min(1),
  kind: BubbleKindSchema,
  text: z.string().max(BUBBLE_TEXT_MAX),
  x: PercentSchema,
  y: PercentSchema,
});
export type Bubble = z.infer<typeof BubbleSchema>;

/* ------------------------------------------------------------------------ */
/* Panels: each has its own take history (spec 15).                          */
/* ------------------------------------------------------------------------ */

// CONTRACT: unconfirmed. One generation result for a panel.
export const PanelTakeSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  prompt: z.string(),
  credits: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  /** Placeholder art until takes carry image URLs. */
  art: CoverArtSchema,
});
export type PanelTake = z.infer<typeof PanelTakeSchema>;

export const PanelStateSchema = z.enum(["empty", "queued", "generating", "ready", "failed"]);
export const PANEL_STATES = PanelStateSchema.options;
export type PanelState = z.infer<typeof PanelStateSchema>;

export const PROMPT_MAX = 1_000;

const PanelBase = z.object({
  id: z.string(),
  prompt: z.string().max(PROMPT_MAX),
  takes: z.array(PanelTakeSchema),
  /** Exactly one selected take once any take exists; `null` before. */
  selectedTakeId: z.string().nullable(),
  bubbles: z.array(BubbleSchema),
});

// CONTRACT: unconfirmed. A panel, discriminated on `state`.
export const PanelSchema = z.discriminatedUnion("state", [
  PanelBase.extend({ state: z.literal("empty") }),
  PanelBase.extend({ state: z.literal("queued"), jobId: z.string() }),
  PanelBase.extend({
    state: z.literal("generating"),
    jobId: z.string(),
    progress: z.number().min(0).max(100),
  }),
  PanelBase.extend({ state: z.literal("ready") }),
  PanelBase.extend({
    state: z.literal("failed"),
    /** Why it failed, in words the user can act on. Credits are refunded. */
    reason: z.string(),
  }),
]);
export type Panel = z.infer<typeof PanelSchema>;

/* ------------------------------------------------------------------------ */
/* Page export: layered PSD or flat PNG, as a background job.                */
/* ------------------------------------------------------------------------ */

export const ComicExportFormatSchema = z.enum(["psd", "png"]);
export const COMIC_EXPORT_FORMATS = ComicExportFormatSchema.options;
export type ComicExportFormat = z.infer<typeof ComicExportFormatSchema>;

const ComicExportBase = z.object({
  id: z.string(),
  format: ComicExportFormatSchema,
  /** One line describing the options, written by the API. */
  summary: z.string(),
  createdAt: z.iso.datetime(),
});

// CONTRACT: unconfirmed. A page export job, discriminated on `status`.
export const ComicExportSchema = z.discriminatedUnion("status", [
  ComicExportBase.extend({ status: z.literal("preparing") }),
  ComicExportBase.extend({ status: z.literal("rendering"), progress: z.number().min(0).max(100) }),
  ComicExportBase.extend({
    status: z.literal("ready"),
    downloadUrl: z.string(),
    fileName: z.string(),
    expiresAt: z.iso.datetime(),
  }),
  ComicExportBase.extend({ status: z.literal("failed"), reason: z.string() }),
]);
export type ComicExport = z.infer<typeof ComicExportSchema>;
export type ComicExportStatus = ComicExport["status"];

// CONTRACT: unconfirmed. POST /api/comics/:id/exports
export const ComicExportRequestSchema = z.object({
  format: ComicExportFormatSchema,
  /** PSD only: bubbles stay editable text layers instead of being flattened. */
  bubblesAsText: z.boolean(),
  /** PSD only: background on its own layer, apart from the character. */
  separateBackground: z.boolean(),
});
export type ComicExportRequest = z.infer<typeof ComicExportRequestSchema>;

/* ------------------------------------------------------------------------ */
/* Pages.                                                                    */
/* ------------------------------------------------------------------------ */

export const TITLE_MAX = 80;

// CONTRACT: unconfirmed. GET /api/comics/:id
export const ComicPageSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(TITLE_MAX),
  layout: ComicLayoutSchema,
  updatedAt: z.iso.datetime(),
  /** In reading order; slot `i` of the layout holds panel `i`. */
  panels: z.array(PanelSchema).min(1).max(6),
  exports: z.array(ComicExportSchema),
});
export type ComicPage = z.infer<typeof ComicPageSchema>;

// CONTRACT: unconfirmed. One row of GET /api/comics
export const ComicSummarySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  layout: ComicLayoutSchema,
  updatedAt: z.iso.datetime(),
  panelCount: z.number().int().positive(),
  readyCount: z.number().int().nonnegative(),
  bubbleCount: z.number().int().nonnegative(),
  /** Art of the first panel's selected take, `null` when nothing is drawn yet. */
  cover: CoverArtSchema.nullable(),
});
export type ComicSummary = z.infer<typeof ComicSummarySchema>;

export const ComicListSchema = z.array(ComicSummarySchema);

// CONTRACT: unconfirmed. POST /api/comics
export const CreateComicRequestSchema = z.object({
  title: z.string().trim().min(1).max(TITLE_MAX),
  layout: ComicLayoutSchema,
});
export type CreateComicRequest = z.infer<typeof CreateComicRequestSchema>;

/* ------------------------------------------------------------------------ */
/* Free edits. Both the client (optimistic) and the API apply these.         */
/* ------------------------------------------------------------------------ */

// CONTRACT: unconfirmed. POST /api/comics/:id/actions
export const ComicActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("rename"), title: z.string().trim().min(1).max(TITLE_MAX) }),
  z.object({
    type: z.literal("setPrompt"),
    panelId: z.string(),
    prompt: z.string().max(PROMPT_MAX),
  }),
  z.object({ type: z.literal("selectTake"), panelId: z.string(), takeId: z.string() }),
  z.object({
    type: z.literal("movePanel"),
    panelId: z.string(),
    toIndex: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("addBubble"),
    panelId: z.string(),
    /** Chosen by the client so the optimistic bubble keeps its id. */
    bubbleId: z.string().min(1),
    kind: BubbleKindSchema,
    text: z.string().max(BUBBLE_TEXT_MAX),
  }),
  z.object({
    type: z.literal("editBubble"),
    panelId: z.string(),
    bubbleId: z.string(),
    kind: BubbleKindSchema,
    text: z.string().max(BUBBLE_TEXT_MAX),
  }),
  z.object({
    type: z.literal("moveBubble"),
    panelId: z.string(),
    bubbleId: z.string(),
    x: PercentSchema,
    y: PercentSchema,
  }),
  z.object({ type: z.literal("deleteBubble"), panelId: z.string(), bubbleId: z.string() }),
]);
export type ComicAction = z.infer<typeof ComicActionSchema>;

// CONTRACT: unconfirmed. GET /api/comics/:id/panels/:panelId/quote
export const PanelQuoteSchema = z.object({ credits: z.number().int().nonnegative() });
export type PanelQuote = z.infer<typeof PanelQuoteSchema>;

// CONTRACT: unconfirmed. DELETE /api/comics/:id
export const DeletedComicSchema = z.object({ deleted: z.string() });
