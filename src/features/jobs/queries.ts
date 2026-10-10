import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { JobsSchema } from "./schema";

export const activeJobsQuery = queryOptions({
  queryKey: keys.jobs.active(),
  queryFn: ({ signal }) => request("/api/jobs", JobsSchema, { signal }),
  // Generation progress moves on its own; poll while the page is open.
  refetchInterval: 5_000,
});
