import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { RecentStoryboardsSchema } from "./schema";

export const recentStoryboardsQuery = queryOptions({
  queryKey: keys.storyboards.recent(),
  queryFn: ({ signal }) => request("/api/storyboards", RecentStoryboardsSchema, { signal }),
});
