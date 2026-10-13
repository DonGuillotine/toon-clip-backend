import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";
import { readWalletFunds } from "@/lib/solana/payment";

import { BalanceSchema, SessionSchema } from "./schema";

/** The balance, the prices, and every change to the balance. */
export const balanceQuery = queryOptions({
  queryKey: keys.credits.balance(),
  queryFn: ({ signal }) => request("/api/v1/balance", BalanceSchema, { signal }),
  staleTime: 30 * 1000,
});

/** Whether this browser holds an API session, and when it ends. */
export const sessionQuery = queryOptions({
  queryKey: keys.session(),
  queryFn: ({ signal }) => request("/api/session", SessionSchema, { signal }),
  staleTime: Infinity,
});

/** SOL and payment-token balances of a wallet, read from Solana Devnet. */
export const walletFundsQuery = (address: string, mint: string) =>
  queryOptions({
    queryKey: keys.credits.wallet(address, mint),
    queryFn: () => readWalletFunds(address, mint),
    staleTime: 10 * 1000,
  });
