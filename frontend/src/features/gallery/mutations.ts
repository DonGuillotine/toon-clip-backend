"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, request } from "@/lib/api/client";

import { applyGalleryAction } from "./collections";
import { galleryQuery } from "./queries";
import {
  type Gallery,
  type GalleryAction,
  type GalleryActionResult,
  GalleryActionResultSchema,
} from "./schema";

type Context = { readonly previous: Gallery | undefined };

/** What failed, in words, for each kind of change. */
function failureCopy(action: GalleryAction, error: Error): string {
  if (error instanceof ApiError && error.status === 409) {
    return "Another collection already has that name. Pick a different one.";
  }
  if (error instanceof ApiError && error.status === 404) {
    return "That collection or work is gone. The gallery has been refreshed.";
  }
  switch (action.type) {
    case "create":
      return "The collection was not created. Check your connection and try again.";
    case "rename":
      return "The new name did not save. Try again.";
    case "setVisibility":
      return "Sharing did not change. Try again.";
    case "delete":
      return "The collection was not deleted. Try again.";
    case "addItem":
      return "That work was not added. Try again.";
    case "removeItem":
      return "That work was not removed. Try again.";
  }
}

/**
 * Every curation change goes through one mutation. The same reducer the API
 * runs is applied to the cache first, so the change shows at once; an error
 * puts the gallery back as it was.
 */
export function useGalleryAction() {
  const queryClient = useQueryClient();
  const { queryKey } = galleryQuery;

  return useMutation<GalleryActionResult, Error, GalleryAction, Context>({
    mutationFn: (body) =>
      request("/api/gallery/actions", GalleryActionResultSchema, { method: "POST", body }),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        const outcome = applyGalleryAction(previous.collections, action, {
          now: new Date().toISOString(),
          newId: `pending_${String(Date.now())}`,
          workIds: new Set(previous.works.map((work) => work.id)),
        });
        if (outcome.ok) {
          queryClient.setQueryData(queryKey, {
            ...previous,
            collections: [...outcome.collections],
          });
        }
      }
      return { previous };
    },
    onSuccess: (result) => {
      const current = queryClient.getQueryData(queryKey);
      if (current)
        queryClient.setQueryData(queryKey, { ...current, collections: result.collections });
    },
    onError: (error, action, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(failureCopy(action, error));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
