import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError, request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { SegmentFixSchema, type SegmentFixRequest } from "./schema";

/** Retries only a request that never got an answer; refusals are final. */
function retryLostRequest(count: number, error: Error): boolean {
  return !(error instanceof ApiError) && count < 2;
}

type CreateVariables = SegmentFixRequest & { readonly idempotencyKey: string };

/**
 * Asks for one segment to be rendered again. Billable, so the key made when
 * the creator pressed the button travels with every retry of it.
 */
export function useCreateSegmentFix(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: CreateVariables) =>
      request("/api/segment-fixes", SegmentFixSchema, {
        method: "POST",
        body,
        idempotencyKey,
      }),
    retry: retryLostRequest,
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: keys.segmentFixes.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: keys.projects.detail(projectId) }),
      ]),
  });
}

/** Tries a failed fix again. Free: the failure was refunded. */
export function useRetrySegmentFix(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fixId: string) =>
      request(`/api/segment-fixes/${encodeURIComponent(fixId)}/retry`, SegmentFixSchema, {
        method: "POST",
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.segmentFixes.list(projectId) }),
  });
}
