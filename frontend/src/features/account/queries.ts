import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { AccountSchema, CreditPacksSchema, LedgerSchema, RecipesSchema } from "./schema";

export const accountQuery = queryOptions({
  queryKey: keys.account.me(),
  queryFn: ({ signal }) => request("/api/me", AccountSchema, { signal }),
});

/** Every spend, refund and top-up, newest first. */
export const ledgerQuery = queryOptions({
  queryKey: keys.account.ledger(),
  queryFn: ({ signal }) => request("/api/me/ledger", LedgerSchema, { signal }),
});

export const creditPacksQuery = queryOptions({
  queryKey: keys.account.creditPacks(),
  queryFn: ({ signal }) => request("/api/credit-packs", CreditPacksSchema, { signal }),
  staleTime: 5 * 60_000,
});

/** Recipes this creator contributed to the Magic Prompt library. */
export const recipesQuery = queryOptions({
  queryKey: keys.account.recipes(),
  queryFn: ({ signal }) => request("/api/me/recipes", RecipesSchema, { signal }),
});
