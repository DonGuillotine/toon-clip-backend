import { z } from "zod";

// CONTRACT: unconfirmed. Shape the frontend expects from the account endpoint.
export const AccountSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  handle: z.string().min(1),
  /** Whole credits. The client never computes this; it only shows it. */
  credits: z.number().int().nonnegative(),
  hasCompletedTour: z.boolean(),
});

export type Account = z.infer<typeof AccountSchema>;
