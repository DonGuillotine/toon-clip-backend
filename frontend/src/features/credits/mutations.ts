import { type Connection, type Transaction } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, apiErrorDetail, newIdempotencyKey, request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";
import {
  confirmTransfer,
  getConnection,
  prepareTransfer,
  type PreparedTransfer,
} from "@/lib/solana/payment";

import {
  isPaid,
  type PaymentIntent,
  PaymentIntentSchema,
  WalletChallengeSchema,
  WalletLinkSchema,
} from "./schema";
import { usePaymentMemory } from "./stores";

/** A failure with copy written for the person paying. */
export class PaymentError extends Error {
  readonly copy: string;
  constructor(copy: string) {
    super(copy);
    this.name = "PaymentError";
    this.copy = copy;
  }
}

/** The copy for any failure in this file. */
export function paymentErrorCopy(error: unknown): string {
  if (error instanceof PaymentError) return error.copy;
  return apiErrorDetail(error) ?? "Something went wrong. Nothing was charged. Try again.";
}

/** Wallets report a cancelled prompt as an error whose message says "reject". */
function isWalletRejection(error: unknown): boolean {
  return error instanceof Error && /reject|cancel|denied|declined/i.test(error.message);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

type LinkVariables = {
  readonly address: string;
  readonly sessionExpiresAt: number;
  readonly signMessage: (message: Uint8Array) => Promise<Uint8Array>;
};

/**
 * Links a wallet to this session: the API sends a message, the wallet signs
 * it (no tokens move), and the API checks the signature.
 */
export function useLinkWallet() {
  const queryClient = useQueryClient();
  const rememberWallet = usePaymentMemory((state) => state.rememberWallet);

  return useMutation({
    mutationFn: async ({ address, signMessage }: LinkVariables) => {
      const challenge = await request("/api/v1/wallet-challenges", WalletChallengeSchema, {
        method: "POST",
        body: { walletAddress: address },
      });
      let signature: Uint8Array;
      try {
        signature = await signMessage(new TextEncoder().encode(challenge.message));
      } catch (error) {
        throw new PaymentError(
          isWalletRejection(error)
            ? "You cancelled the signature in your wallet. Your wallet is not verified yet."
            : "Your wallet could not sign the message. Unlock it and try again.",
        );
      }
      return request("/api/v1/wallet-links", WalletLinkSchema, {
        method: "POST",
        body: { challengeId: challenge.id, signatureBase64: toBase64(signature) },
      });
    },
    onSuccess: (link, { sessionExpiresAt }) => {
      rememberWallet(sessionExpiresAt, link.walletAddress);
      // A first link can add free credits; the balance is the API's to report.
      void queryClient.invalidateQueries({ queryKey: keys.credits.balance() });
      const granted = link.creditsGranted ?? 0;
      if (granted > 0) {
        toast.success(`${String(granted)} free credits added for connecting your wallet.`);
      }
    },
  });
}

/**
 * Asks the API to check a sent transfer. The API only accepts a finalized
 * transaction, which takes Devnet around half a minute, so it keeps asking
 * for up to a minute.
 */
async function verifyUntilPaid(paymentId: string, signature: string): Promise<PaymentIntent> {
  let latest: PaymentIntent | null = null;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    if (attempt > 0) await wait(4_000);
    // A fresh key per check: an earlier check may have been answered "not yet".
    latest = await request(
      `/api/v1/payment-intents/${encodeURIComponent(paymentId)}/verify`,
      PaymentIntentSchema,
      {
        method: "POST",
        body: { transactionSignature: signature },
        idempotencyKey: newIdempotencyKey(),
      },
    );
    if (isPaid(latest)) return latest;
  }
  if (latest === null) throw new PaymentError("The payment could not be checked. Try again.");
  return latest;
}

/**
 * Opens a payment for a credit pack: the API names the recipient, token,
 * amount, and a reference to attach. Nothing is charged until the wallet
 * sends the transfer.
 */
export function useOpenPayment() {
  return useMutation({
    mutationFn: async ({ packId, idempotencyKey }: { packId: string; idempotencyKey: string }) => {
      try {
        return await request("/api/v1/payment-intents", PaymentIntentSchema, {
          method: "POST",
          body: { packId },
          idempotencyKey,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          throw new PaymentError("Verify your wallet before paying. Nothing was charged.");
        }
        throw error;
      }
    },
  });
}

export type PayStep = "approving" | "confirming" | "verifying";

type PayVariables = {
  readonly intent: PaymentIntent;
  readonly decimals: number;
  /** The payment token's name, for copy: "USDC". */
  readonly token: string;
  readonly sessionExpiresAt: number;
  readonly sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
  readonly onStep: (step: PayStep) => void;
};

/**
 * Pays an open payment: the wallet sends the transfer, Devnet confirms it,
 * and the API verifies it and grants the credits. The sent transfer is
 * remembered before it is verified, so it can be finished later if the page
 * closes.
 */
export function usePay() {
  const queryClient = useQueryClient();
  const rememberPending = usePaymentMemory((state) => state.rememberPending);
  const clearPending = usePaymentMemory((state) => state.clearPending);

  return useMutation({
    mutationFn: async ({
      intent,
      decimals,
      token,
      sessionExpiresAt,
      sendTransaction,
      onStep,
    }: PayVariables) => {
      onStep("approving");
      let signature: string;
      let prepared: PreparedTransfer;
      try {
        prepared = await prepareTransfer({
          payer: intent.payer,
          recipient: intent.recipient,
          mint: intent.mint,
          reference: intent.reference,
          amountAtomic: intent.amountAtomic,
          decimals,
        });
        signature = await sendTransaction(prepared.transaction, getConnection());
      } catch (error) {
        throw new PaymentError(
          isWalletRejection(error)
            ? "You cancelled the payment in your wallet. Nothing was charged."
            : `Your wallet could not send the payment. Check it holds ${intent.amount} ${token} and a little SOL for the fee, then try again. Nothing was charged.`,
        );
      }

      rememberPending(sessionExpiresAt, {
        paymentId: intent.id,
        signature,
        credits: intent.credits,
        amount: intent.amount,
        token,
      });

      onStep("confirming");
      try {
        await confirmTransfer(signature, prepared);
      } catch {
        throw new PaymentError(
          "Your payment was sent, but Solana Devnet has not confirmed it yet. Check it again in a minute from the credits page.",
        );
      }

      onStep("verifying");
      const verified = await verifyUntilPaid(intent.id, signature);
      if (isPaid(verified)) clearPending();
      return verified;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.credits.balance() }),
  });
}

/** Checks a remembered transfer again and grants its credits once verified. */
export function useVerifyPayment() {
  const queryClient = useQueryClient();
  const clearPending = usePaymentMemory((state) => state.clearPending);

  return useMutation({
    mutationFn: ({ paymentId, signature }: { paymentId: string; signature: string }) =>
      verifyUntilPaid(paymentId, signature),
    onSuccess: (intent) => {
      if (isPaid(intent)) clearPending();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.credits.balance() }),
  });
}
