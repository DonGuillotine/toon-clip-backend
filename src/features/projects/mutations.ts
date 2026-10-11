import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type SelectionRequest } from "@/features/catalog/schema";
import { ApiError, request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { ExportSchema, type Project, ProjectSchema, type ShotPatch } from "./schema";

/**
 * Every write here carries the idempotency key made when the user acted
 * (`newIdempotencyKey()`), in its variables. A retry reuses the variables,
 * so a request lost on the network is retried without a second charge.
 */

/** Retries only a request that never got an answer; the API's refusals are final. */
function retryLostRequest(count: number, error: Error): boolean {
  return !(error instanceof ApiError) && count < 2;
}

type Keyed = { readonly idempotencyKey: string };

/** Creates a project from an example. Costs credits; the API charges them. */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scenarioId, selectionId, idempotencyKey }: SelectionRequest & Keyed) =>
      request("/api/v1/projects", ProjectSchema, {
        method: "POST",
        body: { scenarioId, selectionId },
        idempotencyKey,
      }),
    retry: retryLostRequest,
    onSuccess: (project) => {
      queryClient.setQueryData(keys.projects.detail(project.id), project);
    },
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: keys.projects.list() }),
        queryClient.invalidateQueries({ queryKey: keys.credits.balance() }),
      ]),
  });
}

type PatchVariables = Keyed & { readonly shotId: string; readonly patch: ShotPatch };

/**
 * Flag, lock, or choose a take. Shown at once, replaced by the project the
 * API answers with, rolled back if it refuses.
 */
export function usePatchShot(projectId: string) {
  const queryClient = useQueryClient();
  const key = keys.projects.detail(projectId);

  return useMutation({
    mutationFn: ({ shotId, patch, idempotencyKey }: PatchVariables) =>
      request(
        `/api/v1/projects/${encodeURIComponent(projectId)}/shots/${encodeURIComponent(shotId)}`,
        ProjectSchema,
        { method: "PATCH", body: patch, idempotencyKey },
      ),
    retry: retryLostRequest,
    onMutate: async ({ shotId, patch }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Project>(key);
      queryClient.setQueryData<Project>(key, (project) =>
        project === undefined
          ? project
          : {
              ...project,
              shots: project.shots.map((shot) =>
                shot.id === shotId
                  ? {
                      ...shot,
                      flagged: patch.flagged ?? shot.flagged,
                      locked: patch.locked ?? shot.locked,
                      selectedTakeId: patch.selectedTakeId ?? shot.selectedTakeId,
                    }
                  : shot,
              ),
            },
      );
      return { previous };
    },
    onSuccess: (project) => {
      queryClient.setQueryData(key, project);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

type ReviseVariables = Keyed & { readonly shotId: string; readonly revisionOptionId: string };

/** Adds a take to a shot from one of its prepared revisions. Costs credits. */
export function useReviseShot(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shotId, revisionOptionId, idempotencyKey }: ReviseVariables) =>
      request(
        `/api/v1/projects/${encodeURIComponent(projectId)}/shots/${encodeURIComponent(shotId)}/revisions`,
        ProjectSchema,
        { method: "POST", body: { revisionOptionId }, idempotencyKey },
      ),
    retry: retryLostRequest,
    onSuccess: (project) => {
      queryClient.setQueryData(keys.projects.detail(projectId), project);
    },
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: keys.projects.detail(projectId) }),
        queryClient.invalidateQueries({ queryKey: keys.credits.balance() }),
      ]),
  });
}

/**
 * Unlocks the MP4 for the project's current takes. Charged once per set of
 * takes: returning to a set already unlocked is free.
 */
export function useCreateExport(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey }: Keyed) =>
      request(`/api/v1/projects/${encodeURIComponent(projectId)}/exports`, ExportSchema, {
        method: "POST",
        body: { format: "mp4" },
        idempotencyKey,
      }),
    retry: retryLostRequest,
    onSuccess: (created) => {
      queryClient.setQueryData(keys.projects.export(created.id), created);
    },
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: keys.credits.balance() }),
        queryClient.invalidateQueries({ queryKey: keys.projects.detail(projectId) }),
      ]),
  });
}
