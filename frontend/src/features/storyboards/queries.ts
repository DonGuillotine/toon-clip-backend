import { queryOptions } from "@tanstack/react-query";

import { ApiError, request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import {
  RecentStoryboardsSchema,
  ShotJobSchema,
  ShotQuoteSchema,
  StoryboardDetailSchema,
  type GenerationKind,
} from "./schema";

export const recentStoryboardsQuery = queryOptions({
  queryKey: keys.storyboards.recent(),
  queryFn: ({ signal }) => request("/api/storyboards", RecentStoryboardsSchema, { signal }),
});

export const storyboardDetailQuery = (id: string) =>
  queryOptions({
    queryKey: keys.timeline.detail(id),
    queryFn: ({ signal }) =>
      request(`/api/storyboards/${encodeURIComponent(id)}`, StoryboardDetailSchema, { signal }),
    // A 404 will not fix itself; anything else gets the default retries.
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 3,
  });

/** One generation job, polled until it settles. */
export const shotJobQuery = (id: string, jobId: string) =>
  queryOptions({
    queryKey: keys.timeline.job(id, jobId),
    queryFn: ({ signal }) =>
      request(
        `/api/storyboards/${encodeURIComponent(id)}/jobs/${encodeURIComponent(jobId)}`,
        ShotJobSchema,
        { signal },
      ),
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "ready" || status === "failed" ? false : 1_000;
    },
  });

/** What a generation on this shot costs. The API prices it; the client shows it. */
export const shotQuoteQuery = (id: string, shotId: string, kind: GenerationKind) =>
  queryOptions({
    queryKey: keys.timeline.quote(id, shotId, kind),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ kind });
      return request(
        `/api/storyboards/${encodeURIComponent(id)}/shots/${encodeURIComponent(shotId)}/quote?${params.toString()}`,
        ShotQuoteSchema,
        { signal },
      );
    },
  });
