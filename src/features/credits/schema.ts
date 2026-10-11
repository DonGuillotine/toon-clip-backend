import { z } from "zod";

import { PricesSchema } from "@/features/catalog/schema";
import { readableList, UnixSecondsSchema } from "@/lib/api/schema-helpers";

/** One change to the balance, newest first (the API keeps the last 50). */
export const HistoryEntrySchema = z.object({
  /** Signed: a purchase adds, a spend takes away. */
  delta: z.number().int(),
  /** Why: "purchase", "create", "revision" or "export". Kept as text so a new reason still shows. */
  reason: z.string().min(1),
  created: UnixSecondsSchema,
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

/** `GET /v1/balance`. Observed. */
export const BalanceSchema = z.object({
  balance: z.number().int(),
  prices: PricesSchema,
  network: z.string().min(1),
  history: readableList(HistoryEntrySchema),
});

export type Balance = z.infer<typeof BalanceSchema>;

/** `GET /api/session`: this browser's API session, without the token. */
export const SessionSchema = z.object({
  active: z.boolean(),
  expiresAt: UnixSecondsSchema.nullable(),
});

/** `POST /v1/wallet-challenges`. Observed. */
export const WalletChallengeSchema = z.object({
  id: z.string().min(1),
  walletAddress: z.string().min(32).max(44),
  message: z.string().min(1),
  expiresAt: UnixSecondsSchema,
  used: z.boolean(),
});

/** `POST /v1/wallet-links`. Observed. */
export const WalletLinkSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  network: z.string().min(1),
});

/**
 * `POST /v1/payment-intents` and `GET /v1/payment-intents/{id}`. Observed,
 * as a Solana Pay transfer request. Only `pending` has been seen; any other
 * state is kept as text and credits are judged by `creditsGranted`.
 */
export const PaymentIntentSchema = z.object({
  id: z.string().min(1),
  packId: z.string().min(1),
  state: z.string().min(1),
  network: z.string().min(1),
  payer: z.string().min(32).max(44),
  recipient: z.string().min(32).max(44),
  mint: z.string().min(32).max(44),
  amount: z.string().min(1),
  amountAtomic: z.number().int().positive(),
  credits: z.number().int().positive(),
  reference: z.string().min(32).max(44),
  createdAt: UnixSecondsSchema,
  expiresAt: UnixSecondsSchema,
  creditsGranted: z.number().int().nonnegative(),
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

/** True once the API has granted the pack's credits. */
export function isPaid(intent: Pick<PaymentIntent, "creditsGranted">): boolean {
  return intent.creditsGranted > 0;
}
