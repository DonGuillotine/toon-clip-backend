import { type LedgerEntry, type LedgerKind } from "./schema";

/**
 * Pure credit arithmetic for the fixture account. The server store calls
 * these; the client never does (AGENTS.md §4: credits are never computed in
 * the client). Kept pure so the rules are tested without a server.
 */

export type Wallet = {
  readonly balance: number;
  /** Newest first. */
  readonly ledger: readonly LedgerEntry[];
};

export type WalletResult =
  | { readonly ok: true; readonly wallet: Wallet; readonly entry: LedgerEntry | null }
  | { readonly ok: false; readonly reason: "insufficient" | "invalid"; readonly balance: number };

type Move = {
  readonly amount: number;
  readonly reason: string;
  readonly at: Date;
  readonly id: string;
};

function record(wallet: Wallet, kind: LedgerKind, move: Move, balance: number): WalletResult {
  const entry: LedgerEntry = {
    id: move.id,
    kind,
    amount: move.amount,
    reason: move.reason,
    at: move.at.toISOString(),
    balance,
  };
  return { ok: true, wallet: { balance, ledger: [entry, ...wallet.ledger] }, entry };
}

function valid(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0;
}

/**
 * Take credits. A free action (amount 0) succeeds and writes nothing, so a
 * caller can always route through here. Never goes below zero.
 */
export function spend(wallet: Wallet, move: Move): WalletResult {
  if (!valid(move.amount)) return { ok: false, reason: "invalid", balance: wallet.balance };
  if (move.amount === 0) return { ok: true, wallet, entry: null };
  if (move.amount > wallet.balance) {
    return { ok: false, reason: "insufficient", balance: wallet.balance };
  }
  return record(wallet, "spend", move, wallet.balance - move.amount);
}

/** Give credits back after a failed or cancelled job. */
export function refund(wallet: Wallet, move: Move): WalletResult {
  if (!valid(move.amount)) return { ok: false, reason: "invalid", balance: wallet.balance };
  if (move.amount === 0) return { ok: true, wallet, entry: null };
  return record(wallet, "refund", move, wallet.balance + move.amount);
}

/** Add purchased credits. A top-up of nothing is a mistake, not a no-op. */
export function topUp(wallet: Wallet, move: Move): WalletResult {
  if (!valid(move.amount) || move.amount === 0) {
    return { ok: false, reason: "invalid", balance: wallet.balance };
  }
  return record(wallet, "top-up", move, wallet.balance + move.amount);
}

/** Sum of a kind over the ledger, for the profile's summary line. */
export function totalOf(ledger: readonly LedgerEntry[], kind: LedgerKind): number {
  return ledger.reduce((sum, entry) => (entry.kind === kind ? sum + entry.amount : sum), 0);
}
