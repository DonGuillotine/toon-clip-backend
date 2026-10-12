import { z } from "zod";

import { ApiIdSchema } from "@/features/catalog/schema";
import { readableList, UnixSecondsSchema } from "@/lib/api/schema-helpers";

/*
 * Fixing one segment of a shot with AI: the creator cuts a shot, picks the
 * part between two cuts, and says what should change there. The API renders
 * that part again and adds the result to the shot as a new take, so the old
 * take is kept (PRODUCT.md, "Nothing is lost").
 *
 * CONTRACT: unconfirmed. The API has no endpoint for this yet. Proposed:
 *
 *   POST /v1/projects/{projectId}/shots/{shotId}/segment-fixes
 *        body { startSeconds, endSeconds, instruction }, Idempotency-Key
 *        -> SegmentFix, charged like a revision
 *   GET  /v1/projects/{projectId}/segment-fixes -> SegmentFix[]
 *   POST /v1/segment-fixes/{id}/retry -> SegmentFix (failed only, free)
 *
 * Until it lands this runs on fixtures behind dev mode
 * (`src/app/api/segment-fixes`).
 */

export const SEGMENT_FIX_STATES: readonly ["queued", "generating", "ready", "failed"] = [
  "queued",
  "generating",
  "ready",
  "failed",
];

export type SegmentFixState = (typeof SEGMENT_FIX_STATES)[number];

const Base = z.object({
  id: ApiIdSchema,
  projectId: ApiIdSchema,
  shotId: ApiIdSchema,
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  instruction: z.string().min(1),
  /** What the fix cost. Refunded when it fails. */
  credits: z.number().int().nonnegative(),
  createdAt: UnixSecondsSchema,
});

/** One fix, as a discriminated union so each state carries only what it has. */
export const SegmentFixSchema = z.discriminatedUnion("state", [
  Base.extend({ state: z.literal("queued") }),
  Base.extend({ state: z.literal("generating"), progress: z.number().min(0).max(1) }),
  /** The new take on the shot, with only this segment changed. */
  Base.extend({ state: z.literal("ready"), takeId: ApiIdSchema.nullable() }),
  Base.extend({ state: z.literal("failed"), reason: z.string().min(1) }),
]);

export type SegmentFix = z.infer<typeof SegmentFixSchema>;

export const SegmentFixesSchema = readableList(SegmentFixSchema);

export const SegmentFixRequestSchema = z.object({
  projectId: ApiIdSchema,
  shotId: ApiIdSchema,
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  instruction: z.string().trim().min(3).max(600),
});

export type SegmentFixRequest = z.infer<typeof SegmentFixRequestSchema>;

/** True while the fix still needs watching. */
export function isActive(fix: SegmentFix): boolean {
  switch (fix.state) {
    case "queued":
    case "generating":
      return true;
    case "ready":
    case "failed":
      return false;
  }
}
