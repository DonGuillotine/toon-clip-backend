import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { WatchLibrarySchema } from "./schema";

export const watchLibraryQuery = queryOptions({
  queryKey: keys.watch.library(),
  queryFn: ({ signal }) => request("/api/watch", WatchLibrarySchema, { signal }),
});
