"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { characterQuery, charactersQuery } from "./queries";
import {
  type CharacterDraft,
  type CharacterSheet,
  CharacterSheetSchema,
  type CharacterSummary,
} from "./schema";
import { toSummary } from "./sheet";

const path = (id: string) => `/api/characters/${encodeURIComponent(id)}`;

/** Save a new sheet. The cast and the desk pick it up on invalidation. */
export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation<CharacterSheet, Error, CharacterDraft>({
    mutationFn: (body) =>
      request("/api/characters", CharacterSheetSchema, { method: "POST", body }),
    onSuccess: (sheet) => {
      queryClient.setQueryData(characterQuery(sheet.id).queryKey, sheet);
      toast(`${sheet.name} joined your cast.`);
    },
    onError: () => {
      toast.error("The character was not saved. Your edits are still here; try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.characters.all() }),
  });
}

type SaveContext = {
  readonly previous: CharacterSheet | undefined;
  readonly previousList: CharacterSummary[] | undefined;
};

/** Save edits to a sheet. The sheet and its cast row update at once and roll back on error. */
export function useSaveCharacter(id: string) {
  const queryClient = useQueryClient();
  const { queryKey } = characterQuery(id);
  const listKey = charactersQuery.queryKey;

  return useMutation<CharacterSheet, Error, CharacterDraft, SaveContext>({
    mutationFn: (body) => request(path(id), CharacterSheetSchema, { method: "PUT", body }),
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: keys.characters.all() });
      const previous = queryClient.getQueryData(queryKey);
      const previousList = queryClient.getQueryData(listKey);
      if (previous) {
        const optimistic: CharacterSheet = { ...previous, ...draft };
        queryClient.setQueryData(queryKey, optimistic);
        if (previousList) {
          queryClient.setQueryData(
            listKey,
            previousList.map((row) => (row.id === id ? toSummary(optimistic) : row)),
          );
        }
      }
      return { previous, previousList };
    },
    onSuccess: (sheet) => {
      toast(`${sheet.name} is saved.`);
    },
    onError: (_error, _draft, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      if (context?.previousList) queryClient.setQueryData(listKey, context.previousList);
      toast.error("The sheet was not saved. Your edits are still here; try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.characters.all() }),
  });
}

type DeleteContext = { readonly previousList: CharacterSummary[] | undefined };

/** Delete a sheet. It leaves the cast at once and comes back on error. */
export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  const listKey = charactersQuery.queryKey;

  return useMutation<CharacterSheet, Error, string, DeleteContext>({
    mutationFn: (id) => request(path(id), CharacterSheetSchema, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousList = queryClient.getQueryData(listKey);
      if (previousList) {
        queryClient.setQueryData(
          listKey,
          previousList.filter((row) => row.id !== id),
        );
      }
      return { previousList };
    },
    onSuccess: (sheet) => {
      queryClient.removeQueries({ queryKey: characterQuery(sheet.id).queryKey });
      toast(`${sheet.name} was deleted.`);
    },
    onError: (_error, _id, context) => {
      if (context?.previousList) queryClient.setQueryData(listKey, context.previousList);
      toast.error("The character was not deleted. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });
}

/** Copy a sheet (the sample, usually) into one the creator owns. */
export function useDuplicateCharacter() {
  const queryClient = useQueryClient();
  return useMutation<CharacterSheet, Error, string>({
    mutationFn: (id) => request(`${path(id)}/duplicate`, CharacterSheetSchema, { method: "POST" }),
    onSuccess: (sheet) => {
      queryClient.setQueryData(characterQuery(sheet.id).queryKey, sheet);
      toast(`${sheet.name} is yours to edit.`);
    },
    onError: () => {
      toast.error("The copy was not made. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.characters.all() }),
  });
}
