"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import {
  type Generation,
  type GenerationRequest,
  GenerationSchema,
  PlanRequestSchema,
  type PlanRequest,
  PlanSchema,
} from "./schema";

/**
 * Submit a quick create job. The job shows in the recent list at once as
 * queued; if the API refuses it, the list rolls back. Cost comes from the
 * API's response, never from the client.
 */
export function useGenerate() {
  const queryClient = useQueryClient();
  const key = keys.generations.recent();

  return useMutation({
    mutationFn: (input: GenerationRequest) =>
      request("/api/generations", GenerationSchema, { method: "POST", body: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<readonly Generation[]>(key);
      const pending: Generation = {
        id: `pending_${String(Date.now())}`,
        tab: input.tab,
        prompt: input.prompt,
        modelName: null,
        credits: 0,
        createdAt: new Date().toISOString(),
        status: "queued",
        positionInQueue: 1,
      };
      queryClient.setQueryData<readonly Generation[]>(key, [pending, ...(previous ?? [])]);
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: keys.account.me() }),
      ]),
  });
}

/** Retry a failed generation; it shows as queued at once and rolls back on error. */
export function useRetryGeneration() {
  const queryClient = useQueryClient();
  const key = keys.generations.recent();

  return useMutation({
    mutationFn: (id: string) =>
      request(`/api/generations/${encodeURIComponent(id)}/retry`, GenerationSchema, {
        method: "POST",
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<readonly Generation[]>(key);
      queryClient.setQueryData<readonly Generation[]>(key, (list) =>
        list?.map((item): Generation =>
          item.id === id
            ? {
                id: item.id,
                tab: item.tab,
                prompt: item.prompt,
                modelName: item.modelName,
                credits: item.credits,
                createdAt: item.createdAt,
                status: "queued",
                positionInQueue: 1,
              }
            : item,
        ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: keys.account.me() }),
      ]),
  });
}

/** Ask the AI director to plan a storyboard from an idea (spec 7.3). */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanRequest) =>
      request("/api/plans", PlanSchema, {
        method: "POST",
        body: PlanRequestSchema.parse(input),
      }),
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: keys.storyboards.all() }),
        queryClient.invalidateQueries({ queryKey: keys.account.me() }),
      ]),
  });
}
