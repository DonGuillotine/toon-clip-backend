import { queryOptions } from "@tanstack/react-query";

import { ApiError, request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { ExportSchema, ProjectSchema, ProjectsSchema } from "./schema";

/** A 404 will not fix itself; anything else gets the default retries. */
function retryUnlessMissing(count: number, error: Error): boolean {
  return !(error instanceof ApiError && error.status === 404) && count < 3;
}

export const projectsQuery = queryOptions({
  queryKey: keys.projects.list(),
  queryFn: ({ signal }) => request("/api/v1/projects", ProjectsSchema, { signal }),
});

export const projectQuery = (projectId: string) =>
  queryOptions({
    queryKey: keys.projects.detail(projectId),
    queryFn: ({ signal }) =>
      request(`/api/v1/projects/${encodeURIComponent(projectId)}`, ProjectSchema, { signal }),
    retry: retryUnlessMissing,
    // Take videos are signed links that expire. Refetching on a timer keeps
    // them fresh while the project is open.
    staleTime: 2 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

/** One export, polled until it settles. */
export const exportQuery = (exportId: string) =>
  queryOptions({
    queryKey: keys.projects.export(exportId),
    queryFn: ({ signal }) =>
      request(`/api/v1/exports/${encodeURIComponent(exportId)}`, ExportSchema, { signal }),
    retry: retryUnlessMissing,
    staleTime: 0,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      if (state === "failed") return false;
      // A ready export's download link expires after fifteen minutes; keep it fresh.
      return state === "ready" ? 10 * 60 * 1000 : 2_000;
    },
  });
