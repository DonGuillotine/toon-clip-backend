"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { request } from "@/lib/api/client";

import { exportsQuery } from "./queries";
import {
  type ExportJob,
  ExportJobSchema,
  type ExportRequest,
  type ExportsResponse,
} from "./schema";

type Context = { readonly previous: ExportsResponse | undefined };

/** Start an export. The new job shows as preparing at once and rolls back on error. */
export function useStartExport(storyboardId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = exportsQuery(storyboardId);

  return useMutation<ExportJob, Error, ExportRequest, Context>({
    mutationFn: (body) => request("/api/exports", ExportJobSchema, { method: "POST", body }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        const optimistic: ExportJob = {
          id: `pending_${String(Date.now())}`,
          storyboardId,
          kind: body.kind,
          summary: body.kind === "psd" ? "Layered PSD" : "Video",
          createdAt: new Date().toISOString(),
          status: "preparing",
        };
        queryClient.setQueryData(queryKey, {
          ...previous,
          exports: [optimistic, ...previous.exports],
        });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error("The export did not start. Check your connection and try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Retry a failed export. It flips to preparing at once and rolls back on error. */
export function useRetryExport(storyboardId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = exportsQuery(storyboardId);

  return useMutation<ExportJob, Error, string, Context>({
    mutationFn: (id) =>
      request(`/api/exports/${encodeURIComponent(id)}/retry`, ExportJobSchema, { method: "POST" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          exports: previous.exports.map((job): ExportJob =>
            job.id === id
              ? {
                  id: job.id,
                  storyboardId: job.storyboardId,
                  kind: job.kind,
                  summary: job.summary,
                  createdAt: new Date().toISOString(),
                  status: "preparing",
                }
              : job,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error("The retry did not start. Check your connection and try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
