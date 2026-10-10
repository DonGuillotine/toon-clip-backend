"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { storyboardDetailQuery } from "./queries";
import {
  StoryboardDetailSchema,
  type GenerateRequest,
  type ShotAction,
  type StoryboardDetail,
} from "./schema";
import { applyAction, applyGenerate } from "./timeline";
import { useTimelineStore } from "./timeline-store";

let optimisticCounter = 0;
const tempId = (prefix: string): string => {
  optimisticCounter += 1;
  return `${prefix}_pending_${String(optimisticCounter)}`;
};

/** Words for the undo stack and the toasts. */
export function actionLabel(action: ShotAction): string {
  switch (action.type) {
    case "flag":
      return action.flagged ? "Flag shot" : "Clear flag";
    case "lock":
      return action.locked ? "Lock shot" : "Unlock shot";
    case "selectTake":
      return "Select take";
    case "split":
      return "Split shot";
    case "duplicate":
      return "Duplicate shot";
    case "merge":
      return "Merge shots";
    case "trim":
      return "Trim shot";
    case "setFrame":
      return action.frame === null ? `Clear ${action.slot} frame` : `Change ${action.slot} frame`;
    case "editPrompt":
      return "Edit prompt";
    case "restore":
      return "Restore";
  }
}

type Snapshot = { readonly previous: StoryboardDetail | undefined };

function useInvalidateTimeline(id: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: keys.timeline.detail(id) }),
      queryClient.invalidateQueries({ queryKey: keys.storyboards.all() }),
    ]);
}

/** A free edit (flag, lock, take, split, duplicate, merge, undo, redo). Optimistic. */
export function useShotAction(id: string) {
  const queryClient = useQueryClient();
  const record = useTimelineStore((state) => state.record);
  const invalidate = useInvalidateTimeline(id);
  const key = storyboardDetailQuery(id).queryKey;

  return useMutation<StoryboardDetail, Error, ShotAction, Snapshot>({
    mutationFn: (action) =>
      request(`/api/storyboards/${encodeURIComponent(id)}/actions`, StoryboardDetailSchema, {
        method: "POST",
        body: action,
      }),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous && action.type !== "restore") {
        const result = applyAction(previous, action, tempId);
        if (result.ok) queryClient.setQueryData(key, result.detail);
      }
      return { previous };
    },
    onError: (_error, action, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(`${actionLabel(action)} did not save. The timeline is back as it was.`);
    },
    onSuccess: (detail, action, context) => {
      queryClient.setQueryData(key, detail);
      if (action.type !== "restore" && context.previous) {
        record({
          label: actionLabel(action),
          before: context.previous.revision,
          after: detail.revision,
        });
      }
    },
    onSettled: invalidate,
  });
}

export type GenerateVariables = GenerateRequest & { readonly shotId: string };

/** Spend credits on a new take (regenerate) or a new shot (continue from here). */
export function useGenerate(id: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTimeline(id);
  const key = storyboardDetailQuery(id).queryKey;

  return useMutation<StoryboardDetail, Error, GenerateVariables, Snapshot>({
    mutationFn: ({ shotId, ...body }) =>
      request(
        `/api/storyboards/${encodeURIComponent(id)}/shots/${encodeURIComponent(shotId)}/generate`,
        StoryboardDetailSchema,
        { method: "POST", body },
      ),
    onMutate: async ({ shotId, kind }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous) {
        const result = applyGenerate(previous, shotId, kind, tempId("job"), tempId);
        if (result.ok) queryClient.setQueryData(key, result.detail);
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error("The generation did not start, so no credits were spent. Try again.");
    },
    onSuccess: (detail, { kind }) => {
      queryClient.setQueryData(key, detail);
      toast(kind === "continue" ? "New shot queued." : "New take queued. Older takes are kept.");
    },
    onSettled: () =>
      Promise.allSettled([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: keys.jobs.active() }),
        queryClient.invalidateQueries({ queryKey: keys.account.me() }),
      ]),
  });
}
