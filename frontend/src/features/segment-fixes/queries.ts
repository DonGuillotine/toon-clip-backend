import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { isActive, SegmentFixesSchema } from "./schema";

/** A project's segment fixes, polled while any is still rendering. */
export const segmentFixesQuery = (projectId: string) =>
  queryOptions({
    queryKey: keys.segmentFixes.list(projectId),
    queryFn: ({ signal }) =>
      request(`/api/segment-fixes?projectId=${encodeURIComponent(projectId)}`, SegmentFixesSchema, {
        signal,
      }),
    refetchInterval: (query) => (query.state.data?.items.some(isActive) === true ? 1_000 : false),
  });
