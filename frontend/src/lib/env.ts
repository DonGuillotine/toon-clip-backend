import { z } from "zod";

/**
 * Public environment, parsed once. A missing or malformed value fails at
 * startup with the variable's name, not at the first request.
 *
 * `process.env.X` must be read by its literal name for Next to inline it into
 * the client bundle, so each variable is listed here by hand.
 */
const PublicEnvSchema = z.object({
  /** The Toon Clip API origin, without `/v1`. Copy it from `.env.example`. */
  NEXT_PUBLIC_API_URL: z.url(),
  /** Solana RPC for building and confirming credit purchases. */
  NEXT_PUBLIC_SOLANA_RPC_URL: z.url().default("https://api.devnet.solana.com"),
});

export const publicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"],
  NEXT_PUBLIC_SOLANA_RPC_URL: process.env["NEXT_PUBLIC_SOLANA_RPC_URL"],
});

/** The API origin with no trailing slash, so paths can be appended as-is. */
export const API_ORIGIN = publicEnv.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
