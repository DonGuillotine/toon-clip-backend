"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { accountQuery, recipesQuery } from "./queries";
import {
  type Account,
  AccountSchema,
  type ContributorUpdate,
  type Feedback,
  FeedbackReceiptSchema,
  type Preferences,
  type ProfileUpdate,
  type Recipe,
  RecipeSchema,
  type RecipeSubmission,
  type TopUpRequest,
} from "./schema";

type AccountContext = { readonly previous: Account | undefined };

/** Re-read the account, its ledger and recipes after any change. */
function useInvalidateAccount() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: keys.account.all() });
}

/**
 * Apply a change to the cached account at once and roll back on error.
 * Every account edit goes through this so they all behave the same.
 */
function useAccountEdit<Input>(
  mutationFn: (input: Input) => Promise<Account>,
  optimistic: ((account: Account, input: Input) => Account) | null,
) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAccount();
  const { queryKey } = accountQuery;

  return useMutation<Account, Error, Input, AccountContext>({
    mutationFn,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous && optimistic) queryClient.setQueryData(queryKey, optimistic(previous, input));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (account) => {
      queryClient.setQueryData(queryKey, account);
    },
    onSettled: invalidate,
  });
}

/** Buy a credit pack. The balance comes back from the API, never computed here. */
export function useTopUp() {
  return useAccountEdit(
    (body: TopUpRequest) => request("/api/me/top-up", AccountSchema, { method: "POST", body }),
    null,
  );
}

export function useUpdateProfile() {
  return useAccountEdit(
    (body: ProfileUpdate) => request("/api/me", AccountSchema, { method: "PATCH", body }),
    (account, input) => ({ ...account, ...input }),
  );
}

export function useUpdatePreferences() {
  return useAccountEdit(
    (body: Preferences) => request("/api/me/preferences", AccountSchema, { method: "PUT", body }),
    (account, preferences) => ({ ...account, preferences }),
  );
}

export function useSetContributor() {
  return useAccountEdit(
    (body: ContributorUpdate) =>
      request("/api/me/contributor", AccountSchema, { method: "PUT", body }),
    (account, { contributor }) => ({ ...account, contributor }),
  );
}

/** Mark the tour done. Finishing and skipping both call this. */
export function useCompleteTour() {
  return useAccountEdit(
    (_input: undefined) => request("/api/me/tour", AccountSchema, { method: "POST" }),
    (account) => ({ ...account, hasCompletedTour: true }),
  );
}

/* ── Recipes ────────────────────────────────────────────────────────────── */

type RecipesContext = { readonly previous: Recipe[] | undefined };

/** Send a recipe into review. It lists as in review once the API accepts it. */
export function useSubmitRecipe() {
  const invalidate = useInvalidateAccount();
  return useMutation({
    mutationFn: (body: RecipeSubmission) =>
      request("/api/me/recipes", RecipeSchema, { method: "POST", body }),
    onSettled: invalidate,
  });
}

/** Withdraw a recipe. It shows as withdrawn at once and rolls back on error. */
export function useWithdrawRecipe() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAccount();
  const { queryKey } = recipesQuery;

  return useMutation<Recipe, Error, string, RecipesContext>({
    mutationFn: (id) =>
      request(`/api/me/recipes/${encodeURIComponent(id)}/withdraw`, RecipeSchema, {
        method: "POST",
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (list) =>
        list?.map((recipe): Recipe =>
          recipe.id === id ? { ...recipe, status: "withdrawn" } : recipe,
        ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: invalidate,
  });
}

/* ── Feedback ───────────────────────────────────────────────────────────── */

export function useSendFeedback() {
  return useMutation({
    mutationFn: (body: Feedback) =>
      request("/api/feedback", FeedbackReceiptSchema, { method: "POST", body }),
  });
}
