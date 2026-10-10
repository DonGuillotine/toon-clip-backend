import { z } from "zod";

/** Every state a shot can be in. See PRODUCT.md, "Shot states". */
export const ShotStateSchema = z.enum([
  "queued",
  "generating",
  "ready",
  "flagged",
  "locked",
  "failed",
]);
export const SHOT_STATES = ShotStateSchema.options;
export type ShotState = z.infer<typeof ShotStateSchema>;

export const AspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);
export const ASPECT_RATIOS = AspectRatioSchema.options;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

/**
 * Placeholder cover compositions, drawn in screentone until real takes have
 * thumbnails. `null` cover means "use the selected take of the first shot".
 */
export const CoverArtSchema = z.enum(["burst", "rush", "dusk", "rain"]);
export type CoverArt = z.infer<typeof CoverArtSchema>;

export const ShotSummarySchema = z.object({
  id: z.string(),
  state: ShotStateSchema,
  durationSec: z.number().positive(),
});
export type ShotSummary = z.infer<typeof ShotSummarySchema>;

// CONTRACT: unconfirmed.
export const StoryboardSummarySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  idea: z.string(),
  style: z.string(),
  aspectRatio: AspectRatioSchema,
  updatedAt: z.iso.datetime(),
  characterIds: z.array(z.string()),
  shots: z.array(ShotSummarySchema),
  cover: z.object({
    art: CoverArtSchema,
    sfx: z.string().nullable(),
  }),
});
export type StoryboardSummary = z.infer<typeof StoryboardSummarySchema>;

export const RecentStoryboardsSchema = z.array(StoryboardSummarySchema);

/* ------------------------------------------------------------------------ */
/* Storyboard detail: the timeline editor (spec 7.5).                        */
/* ------------------------------------------------------------------------ */

/** A still image that anchors the start or end of a shot. */
export const FrameRefSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Placeholder art until real frames have image URLs. */
  art: CoverArtSchema,
});
export type FrameRef = z.infer<typeof FrameRefSchema>;

export const TakeSettingsSchema = z.object({
  model: z.string(),
  resolution: z.string(),
  durationSec: z.number().positive(),
  seed: z.number().int().nonnegative(),
});
export type TakeSettings = z.infer<typeof TakeSettingsSchema>;

/** One generation result for a shot. Takes are never deleted. */
export const TakeSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  prompt: z.string(),
  /** Regenerate-with-notes text, or `null` when none was given. */
  notes: z.string().nullable(),
  settings: TakeSettingsSchema,
  /** What the API charged for this take. Shown, never computed. */
  credits: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  art: CoverArtSchema,
});
export type Take = z.infer<typeof TakeSchema>;

const ShotBase = z.object({
  id: z.string(),
  durationSec: z.number().positive(),
  prompt: z.string(),
  characterIds: z.array(z.string()),
  firstFrame: FrameRefSchema.nullable(),
  lastFrame: FrameRefSchema.nullable(),
  takes: z.array(TakeSchema),
  /** Exactly one selected take once any take exists; `null` only with no takes. */
  selectedTakeId: z.string().nullable(),
});

// CONTRACT: unconfirmed. A shot, discriminated on `state`.
export const ShotSchema = z
  .discriminatedUnion("state", [
    ShotBase.extend({ state: z.literal("queued"), jobId: z.string() }),
    ShotBase.extend({ state: z.literal("generating"), jobId: z.string() }),
    ShotBase.extend({ state: z.literal("ready") }),
    ShotBase.extend({ state: z.literal("flagged") }),
    ShotBase.extend({ state: z.literal("locked") }),
    ShotBase.extend({
      state: z.literal("failed"),
      reason: z.string(),
      creditsRefunded: z.number().int().nonnegative(),
    }),
  ])
  .refine(
    (shot) =>
      shot.takes.length === 0
        ? shot.selectedTakeId === null
        : shot.takes.some((take) => take.id === shot.selectedTakeId),
    { message: "A shot with takes has exactly one selected take" },
  );
export type Shot = z.infer<typeof ShotSchema>;

/** One clip of 4 to 15 seconds. */
export const SheetSchema = z.object({
  id: z.string(),
  title: z.string(),
  shots: z.array(ShotSchema),
});
export type Sheet = z.infer<typeof SheetSchema>;

export const AudioClipSchema = z.object({
  id: z.string(),
  label: z.string(),
  startSec: z.number().nonnegative(),
  durationSec: z.number().positive(),
});
export type AudioClip = z.infer<typeof AudioClipSchema>;

// CONTRACT: unconfirmed. GET /api/storyboards/:id
export const StoryboardDetailSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  idea: z.string(),
  style: z.string(),
  aspectRatio: AspectRatioSchema,
  updatedAt: z.iso.datetime(),
  cover: StoryboardSummarySchema.shape.cover,
  /** Bumps on every edit. Undo and redo restore by revision. */
  revision: z.number().int().nonnegative(),
  sheets: z.array(SheetSchema),
  audio: z.array(AudioClipSchema),
});
export type StoryboardDetail = z.infer<typeof StoryboardDetailSchema>;

// CONTRACT: unconfirmed. POST /api/storyboards/:id/actions. Edits that cost nothing.
export const ShotActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("flag"), shotId: z.string(), flagged: z.boolean() }),
  z.object({ type: z.literal("lock"), shotId: z.string(), locked: z.boolean() }),
  z.object({ type: z.literal("selectTake"), shotId: z.string(), takeId: z.string() }),
  /** Split at `atSec`, measured from the start of the shot. */
  z.object({ type: z.literal("split"), shotId: z.string(), atSec: z.number().positive() }),
  z.object({ type: z.literal("duplicate"), shotId: z.string() }),
  /** Merge with the next shot in the same sheet. */
  z.object({ type: z.literal("merge"), shotId: z.string() }),
  /** Undo and redo: go back to a revision. Takes made since are kept. */
  z.object({ type: z.literal("restore"), revision: z.number().int().nonnegative() }),
]);
export type ShotAction = z.infer<typeof ShotActionSchema>;

export const GenerationKindSchema = z.enum(["regenerate", "continue"]);
export type GenerationKind = z.infer<typeof GenerationKindSchema>;

// CONTRACT: unconfirmed. GET /api/storyboards/:id/shots/:shotId/quote?kind=
export const ShotQuoteSchema = z.object({
  credits: z.number().int().nonnegative(),
});
export type ShotQuote = z.infer<typeof ShotQuoteSchema>;

// CONTRACT: unconfirmed. POST /api/storyboards/:id/shots/:shotId/generate
export const GenerateRequestSchema = z.object({
  kind: GenerationKindSchema,
  notes: z.string().nullable(),
  /** The quote the user saw. The API rejects the call if its price moved. */
  quotedCredits: z.number().int().nonnegative(),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// CONTRACT: unconfirmed. GET /api/storyboards/:id/jobs/:jobId
export const ShotJobSchema = z.discriminatedUnion("status", [
  z.object({ id: z.string(), status: z.literal("queued"), positionInQueue: z.number().int() }),
  z.object({
    id: z.string(),
    status: z.literal("generating"),
    progress: z.number().min(0).max(100),
  }),
  z.object({ id: z.string(), status: z.literal("ready") }),
  z.object({
    id: z.string(),
    status: z.literal("failed"),
    reason: z.string(),
    creditsRefunded: z.number().int().nonnegative(),
  }),
]);
export type ShotJob = z.infer<typeof ShotJobSchema>;
