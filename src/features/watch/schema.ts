import { z } from "zod";

import { AspectRatioSchema, CoverArtSchema } from "@/features/storyboards/schema";

export const WatchKindSchema = z.enum(["storyboard", "generation"]);
export type WatchKind = z.infer<typeof WatchKindSchema>;

/**
 * One stretch of a finished clip: the selected take of one shot, or the whole
 * of a quick create result. Segments are contiguous and in playback order.
 */
export const WatchSegmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  startSec: z.number().nonnegative(),
  durationSec: z.number().positive(),
  /** Placeholder art until takes have real media URLs. */
  art: CoverArtSchema,
  /** A spoken line for the captions track, or `null` for no dialogue. */
  caption: z.string().nullable(),
});
export type WatchSegment = z.infer<typeof WatchSegmentSchema>;

// CONTRACT: unconfirmed. GET /api/watch. Finished work that can be played back.
export const WatchItemSchema = z
  .object({
    id: z.string(),
    kind: WatchKindSchema,
    title: z.string().min(1),
    /** Style for a storyboard, model for a generation. */
    subtitle: z.string(),
    aspectRatio: AspectRatioSchema,
    updatedAt: z.iso.datetime(),
    durationSec: z.number().positive(),
    cover: z.object({ art: CoverArtSchema, sfx: z.string().nullable() }),
    /** The storyboard to open in the timeline or export, `null` for a generation. */
    storyboardId: z.string().nullable(),
    /** Shots left out because they have no take yet. Zero for a generation. */
    skippedShots: z.number().int().nonnegative(),
    segments: z.array(WatchSegmentSchema).min(1),
  })
  .refine(
    (item) => {
      const last = item.segments.at(-1);
      return (
        last !== undefined && Math.abs(last.startSec + last.durationSec - item.durationSec) < 1e-6
      );
    },
    { message: "Segments must cover the whole clip" },
  );
export type WatchItem = z.infer<typeof WatchItemSchema>;

export const WatchLibrarySchema = z.array(WatchItemSchema);
export type WatchLibrary = z.infer<typeof WatchLibrarySchema>;
