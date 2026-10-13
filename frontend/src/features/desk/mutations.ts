"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, request } from "@/lib/api/client";

import {
  addPalette,
  addStyle,
  removePalette,
  removeStyle,
  updatePalette,
  updateStyle,
} from "./library";
import { deskLibraryQuery } from "./queries";
import {
  type DeskLibrary,
  DeskLibrarySchema,
  type PaletteDraft,
  type StylePresetDraft,
} from "./schema";

/**
 * Every desk write: the change the API is asked to make, and the same change
 * applied to the cached library so the desk updates at once. The pure rules
 * in `library.ts` run on both sides, so the optimistic view matches.
 */
export type DeskEdit =
  | { readonly kind: "createPalette"; readonly draft: PaletteDraft }
  | { readonly kind: "updatePalette"; readonly id: string; readonly draft: PaletteDraft }
  | { readonly kind: "deletePalette"; readonly id: string }
  | { readonly kind: "createStyle"; readonly draft: StylePresetDraft }
  | { readonly kind: "updateStyle"; readonly id: string; readonly draft: StylePresetDraft }
  | { readonly kind: "deleteStyle"; readonly id: string };

function send(edit: DeskEdit): Promise<DeskLibrary> {
  switch (edit.kind) {
    case "createPalette":
      return request("/api/desk/palettes", DeskLibrarySchema, { method: "POST", body: edit.draft });
    case "updatePalette":
      return request(`/api/desk/palettes/${encodeURIComponent(edit.id)}`, DeskLibrarySchema, {
        method: "PUT",
        body: edit.draft,
      });
    case "deletePalette":
      return request(`/api/desk/palettes/${encodeURIComponent(edit.id)}`, DeskLibrarySchema, {
        method: "DELETE",
      });
    case "createStyle":
      return request("/api/desk/styles", DeskLibrarySchema, { method: "POST", body: edit.draft });
    case "updateStyle":
      return request(`/api/desk/styles/${encodeURIComponent(edit.id)}`, DeskLibrarySchema, {
        method: "PUT",
        body: edit.draft,
      });
    case "deleteStyle":
      return request(`/api/desk/styles/${encodeURIComponent(edit.id)}`, DeskLibrarySchema, {
        method: "DELETE",
      });
  }
}

/** The cached library with the edit applied, or `null` when it cannot apply. */
export function applyOptimistic(library: DeskLibrary, edit: DeskEdit): DeskLibrary | null {
  const pendingId = `pending_${String(Date.now())}`;
  switch (edit.kind) {
    case "createPalette":
      return addPalette(library, pendingId, edit.draft);
    case "createStyle":
      return addStyle(library, pendingId, edit.draft);
    case "updatePalette": {
      const result = updatePalette(library, edit.id, edit.draft);
      return result.ok ? result.library : null;
    }
    case "deletePalette": {
      const result = removePalette(library, edit.id);
      return result.ok ? result.library : null;
    }
    case "updateStyle": {
      const result = updateStyle(library, edit.id, edit.draft);
      return result.ok ? result.library : null;
    }
    case "deleteStyle": {
      const result = removeStyle(library, edit.id);
      return result.ok ? result.library : null;
    }
  }
}

const DONE: Record<DeskEdit["kind"], string> = {
  createPalette: "Palette added.",
  updatePalette: "Palette saved.",
  deletePalette: "Palette deleted.",
  createStyle: "Style added.",
  updateStyle: "Style saved.",
  deleteStyle: "Style deleted.",
};

type Context = { readonly previous: DeskLibrary | undefined };

export function useDeskEdit() {
  const queryClient = useQueryClient();
  const { queryKey } = deskLibraryQuery;

  return useMutation<DeskLibrary, Error, DeskEdit, Context>({
    mutationFn: send,
    onMutate: async (edit) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        const next = applyOptimistic(previous, edit);
        if (next) queryClient.setQueryData(queryKey, next);
      }
      return { previous };
    },
    onSuccess: (library, edit) => {
      queryClient.setQueryData(queryKey, library);
      toast(DONE[edit.kind]);
    },
    onError: (error, _edit, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "That changed somewhere else. The desk is back as it was; try again."
          : "That did not save. The desk is back as it was; try again.",
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
