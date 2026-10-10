import { z } from "zod";

/** Every state a shot can be in. See PRODUCT.md, "Shot states". */
export const ShotStateSchema = z.enum(["queued", "generating", "ready", "flagged", "locked", "failed"]);
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
