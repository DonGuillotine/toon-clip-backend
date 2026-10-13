import { z } from "zod";

const JobBase = z.object({
  id: z.string(),
  storyboardId: z.string(),
  storyboardTitle: z.string(),
  shotNumber: z.number().int().positive(),
  takeNumber: z.number().int().positive(),
});

// CONTRACT: unconfirmed. A generation job, discriminated on `status`.
export const JobSchema = z.discriminatedUnion("status", [
  JobBase.extend({
    status: z.literal("queued"),
    positionInQueue: z.number().int().positive(),
  }),
  JobBase.extend({
    status: z.literal("generating"),
    progress: z.number().min(0).max(100),
    secondsLeft: z.number().int().nonnegative().nullable(),
  }),
  JobBase.extend({
    status: z.literal("failed"),
    reason: z.string(),
    creditsRefunded: z.number().int().nonnegative(),
  }),
]);
export type Job = z.infer<typeof JobSchema>;

export const JobsSchema = z.array(JobSchema);
