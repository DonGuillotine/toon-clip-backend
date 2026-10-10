import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { DeskLibrarySchema } from "./schema";

export const deskLibraryQuery = queryOptions({
  queryKey: keys.desk.library(),
  queryFn: ({ signal }) => request("/api/desk", DeskLibrarySchema, { signal }),
});
