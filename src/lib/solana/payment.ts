import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { publicEnv } from "@/lib/env";

/**
 * The Solana side of a credit purchase: reading what a wallet holds and
 * building the Solana Pay transfer the API asks for. The wallet signs and
 * sends; the API verifies the signature and grants the credits.
 *
 * Only Solana Devnet is supported, matching the API (`network`).
 */

export const SUPPORTED_NETWORK = "solana-devnet";

/** Faucets for Devnet funds, linked when a wallet is short. */
export const FAUCETS = {
  sol: "https://faucet.solana.com",
  usdc: "https://faucet.circle.com",
} satisfies Record<string, string>;

/** Enough SOL for one transfer's fee plus a token account if one is needed. */
export const MIN_FEE_LAMPORTS = 3_000_000;

let connection: Connection | undefined;

export function getConnection(): Connection {
  connection ??= new Connection(publicEnv.NEXT_PUBLIC_SOLANA_RPC_URL, "confirmed");
  return connection;
}

export type WalletFunds = {
  /** SOL for fees, in lamports. */
  readonly lamports: number;
  /** The payment token, in its smallest unit. Zero when the wallet has no account for it. */
  readonly tokenAtomic: bigint;
};

/** What a wallet holds of SOL and of the payment token. */
export async function readWalletFunds(address: string, mint: string): Promise<WalletFunds> {
  const rpc = getConnection();
  const owner = new PublicKey(address);
  const tokenAccount = getAssociatedTokenAddressSync(new PublicKey(mint), owner);
  const [lamports, token] = await Promise.allSettled([
    rpc.getBalance(owner),
    rpc.getTokenAccountBalance(tokenAccount),
  ]);
  if (lamports.status === "rejected") throw new Error("Could not read the wallet's SOL balance");
  // No token account yet is a real answer: the wallet holds none.
  const tokenAtomic = token.status === "fulfilled" ? BigInt(token.value.value.amount) : 0n;
  return { lamports: lamports.value, tokenAtomic };
}

export type TransferRequest = {
  readonly payer: string;
  readonly recipient: string;
  readonly mint: string;
  readonly reference: string;
  readonly amountAtomic: number;
  readonly decimals: number;
};

export type PreparedTransfer = {
  readonly transaction: Transaction;
  readonly blockhash: string;
  readonly lastValidBlockHeight: number;
};

/**
 * A Solana Pay token transfer: `transferChecked` from the payer's token
 * account to the recipient's, with the payment reference attached as a
 * read-only key so the API can find it. The recipient's token account is
 * created first only if it does not exist yet.
 */
export async function prepareTransfer(input: TransferRequest): Promise<PreparedTransfer> {
  const rpc = getConnection();
  const payer = new PublicKey(input.payer);
  const recipient = new PublicKey(input.recipient);
  const mint = new PublicKey(input.mint);
  const source = getAssociatedTokenAddressSync(mint, payer);
  const destination = getAssociatedTokenAddressSync(mint, recipient, true);

  const transfer = createTransferCheckedInstruction(
    source,
    mint,
    destination,
    payer,
    BigInt(input.amountAtomic),
    input.decimals,
  );
  transfer.keys.push({
    pubkey: new PublicKey(input.reference),
    isSigner: false,
    isWritable: false,
  });

  const [destinationInfo, latest] = await Promise.allSettled([
    rpc.getAccountInfo(destination),
    rpc.getLatestBlockhash("confirmed"),
  ]);
  if (latest.status === "rejected") throw new Error("Could not reach Solana Devnet");

  const transaction = new Transaction({
    feePayer: payer,
    blockhash: latest.value.blockhash,
    lastValidBlockHeight: latest.value.lastValidBlockHeight,
  });
  if (destinationInfo.status === "fulfilled" && destinationInfo.value === null) {
    transaction.add(
      createAssociatedTokenAccountIdempotentInstruction(payer, destination, recipient, mint),
    );
  }
  transaction.add(transfer);

  return {
    transaction,
    blockhash: latest.value.blockhash,
    lastValidBlockHeight: latest.value.lastValidBlockHeight,
  };
}

/** Waits until the network has confirmed a sent transfer. */
export async function confirmTransfer(
  signature: string,
  prepared: Pick<PreparedTransfer, "blockhash" | "lastValidBlockHeight">,
): Promise<void> {
  const result = await getConnection().confirmTransaction(
    {
      signature,
      blockhash: prepared.blockhash,
      lastValidBlockHeight: prepared.lastValidBlockHeight,
    },
    "confirmed",
  );
  if (result.value.err !== null) throw new Error("The transfer failed on Solana Devnet");
}

/** "Abc1…xyz9": enough of an address to recognise it. */
export function shortAddress(address: string): string {
  return address.length <= 10 ? address : `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** Atomic token units as a human amount: 10000000 with 6 decimals is "10". */
export function formatTokenAmount(atomic: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = atomic / base;
  const fraction = (atomic % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction === "" ? whole.toString() : `${whole.toString()}.${fraction.slice(0, 2)}`;
}

/** Lamports as SOL, to three places. */
export function formatSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(3).replace(/\.?0+$/, "");
}
