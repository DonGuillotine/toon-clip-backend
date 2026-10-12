import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Whether the buy-credits dialog is open, and why. Cross-cutting client state
 * with no URL or server home: any "Buy credits" button or short-balance
 * notice opens the one dialog mounted in the shell.
 */
type BuyCreditsState = {
  readonly open: boolean;
  /** Credits the action that sent the user here needs, when known. */
  readonly needed: number | null;
  /** "join" when a first-time visitor pressed Join now: same flow, a welcome on top. */
  readonly intent: "buy" | "join";
  readonly setOpen: (open: boolean) => void;
};

export const useBuyCreditsStore = create<BuyCreditsState>()((set) => ({
  open: false,
  needed: null,
  intent: "buy",
  setOpen: (open) => {
    set(open ? { open } : { open, needed: null, intent: "buy" });
  },
}));

/** Opens the buy-credits dialog from anywhere. */
export function openBuyCredits(needed?: number): void {
  useBuyCreditsStore.setState({ open: true, needed: needed ?? null, intent: "buy" });
}

/** Join now: connect a wallet and get the first credits, in the same dialog. */
export function openJoin(): void {
  useBuyCreditsStore.setState({ open: true, needed: null, intent: "join" });
}

/**
 * What this browser remembers about payments, because the API has no
 * endpoint to ask:
 *
 * - which wallet it linked to the current session, so a returning visitor
 *   is not asked to sign again;
 * - a transfer that was sent but not yet credited, so closing the tab
 *   between paying and verifying never loses the payment.
 *
 * Both are tied to one API session by its end time: a new session starts
 * with a clean slate.
 */
const PendingPaymentSchema = z.object({
  paymentId: z.string().min(1),
  signature: z.string().min(64).max(88),
  credits: z.number().int().positive(),
  amount: z.string().min(1),
  token: z.string().min(1),
});

export type PendingPayment = z.infer<typeof PendingPaymentSchema>;

/** Storage is untrusted input: parsed on the way in like any other. */
const StoredMemorySchema = z.object({
  sessionExpiresAt: z.number().int().positive().nullable(),
  linkedWallet: z.string().min(32).max(44).nullable(),
  pending: PendingPaymentSchema.nullable(),
});

type PaymentMemoryState = {
  readonly sessionExpiresAt: number | null;
  readonly linkedWallet: string | null;
  readonly pending: PendingPayment | null;
  readonly rememberWallet: (sessionExpiresAt: number, address: string) => void;
  readonly rememberPending: (sessionExpiresAt: number, pending: PendingPayment) => void;
  readonly clearPending: () => void;
};

export const usePaymentMemory = create<PaymentMemoryState>()(
  persist(
    (set, get) => ({
      sessionExpiresAt: null,
      linkedWallet: null,
      pending: null,
      rememberWallet: (sessionExpiresAt, address) => {
        const sameSession = get().sessionExpiresAt === sessionExpiresAt;
        set({
          sessionExpiresAt,
          linkedWallet: address,
          pending: sameSession ? get().pending : null,
        });
      },
      rememberPending: (sessionExpiresAt, pending) => {
        const sameSession = get().sessionExpiresAt === sessionExpiresAt;
        set({
          sessionExpiresAt,
          linkedWallet: sameSession ? get().linkedWallet : null,
          pending,
        });
      },
      clearPending: () => {
        set({ pending: null });
      },
    }),
    {
      name: "toonclip-payments",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ sessionExpiresAt, linkedWallet, pending }) => ({
        sessionExpiresAt,
        linkedWallet,
        pending,
      }),
      merge: (stored, current) => {
        const parsed = StoredMemorySchema.safeParse(stored);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);

/** The linked wallet and pending payment, if they belong to this session. */
export function useSessionMemory(sessionExpiresAt: number | null): {
  readonly linkedWallet: string | null;
  readonly pending: PendingPayment | null;
} {
  const memory = usePaymentMemory();
  if (sessionExpiresAt === null || memory.sessionExpiresAt !== sessionExpiresAt) {
    return { linkedWallet: null, pending: null };
  }
  return { linkedWallet: memory.linkedWallet, pending: memory.pending };
}
