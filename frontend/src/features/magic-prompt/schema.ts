import { z } from "zod";

/** How far Magic Prompt may move away from the original (spec 7.4). */
export const StrengthSchema = z.enum(["light", "standard", "directed"]);
export const STRENGTHS = StrengthSchema.options;
export type Strength = z.infer<typeof StrengthSchema>;

export const MagicPromptRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  strength: StrengthSchema,
  characterIds: z.array(z.string()),
  /** Bumped by "Try another" so the API returns a different take on the prompt. */
  attempt: z.number().int().nonnegative(),
});
export type MagicPromptRequest = z.infer<typeof MagicPromptRequestSchema>;

/** A run of prompt text; `change` points at the change that produced it, if any. */
export const SegmentSchema = z.object({
  text: z.string(),
  change: z.number().int().positive().nullable(),
});
export type Segment = z.infer<typeof SegmentSchema>;

export const ChangeSchema = z.object({
  id: z.number().int().positive(),
  /** What was there before, or null when the change only adds. */
  before: z.string().nullable(),
  /** What replaces it, or null when the change only removes. */
  after: z.string().nullable(),
  reason: z.string().min(1),
});
export type Change = z.infer<typeof ChangeSchema>;

// CONTRACT: unconfirmed. Magic Prompt always suggests; it never overwrites.
export const MagicPromptResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("improved"),
    improved: z.string(),
    original: z.array(SegmentSchema),
    suggestion: z.array(SegmentSchema),
    changes: z.array(ChangeSchema),
    /** What Magic Prompt guessed because the input did not say. */
    assumptions: z.array(z.string()),
    warnings: z.array(z.string()),
    recipes: z.array(z.string()),
  }),
  z.object({
    status: z.literal("declined"),
    reason: z.string().min(1),
  }),
]);
export type MagicPromptResult = z.infer<typeof MagicPromptResultSchema>;
