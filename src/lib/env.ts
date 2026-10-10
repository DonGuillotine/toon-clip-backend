import { z } from "zod";

/**
 * Public environment, parsed once. A missing or malformed value fails at
 * startup with the variable's name, not at the first request.
 *
 * `process.env.X` must be read by its literal name for Next to inline it into
 * the client bundle, so each variable is listed here by hand.
 */
const PublicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().optional(),
});

export const publicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"],
});
