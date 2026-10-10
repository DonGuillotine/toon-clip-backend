"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { type Job, JobSchema } from "./schema";

type Context = { readonly previous: Job[] | undefined };

/**
 * Retry a failed job. It moves to the back of the line at once and rolls
 * back if the API refuses. The refund already happened; the retry is a new
 * reservation that the API prices and settles.
 */
export function useRetryJob() {
  const queryClient = useQueryClient();
  const queryKey = keys.jobs.active();

  return useMutation<Job, Error, string, Context>({
    mutationFn: (id) =>
      request(`/api/jobs/${encodeURIComponent(id)}/retry`, JobSchema, { method: "POST" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Job[]>(queryKey);
      if (previous) {
        const waiting = previous.filter((job) => job.status === "queued").length;
        queryClient.setQueryData<Job[]>(
          queryKey,
          previous.map((job): Job => {
            if (job.id !== id || job.status !== "failed") return job;
            return {
              id: job.id,
              storyboardId: job.storyboardId,
              storyboardTitle: job.storyboardTitle,
              shotNumber: job.shotNumber,
              takeNumber: job.takeNumber + 1,
              status: "queued",
              positionInQueue: waiting + 1,
            };
          }),
        );
      }
      return { previous };
    },
    onSuccess: (job) => {
      toast(
        `Shot ${String(job.shotNumber)} is back in the queue as take ${String(job.takeNumber)}.`,
      );
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error("The retry did not go through. The job is unchanged; try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
