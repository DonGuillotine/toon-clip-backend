import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { AccountSchema } from "./schema";

export const accountQuery = queryOptions({
  queryKey: keys.account.me(),
  queryFn: ({ signal }) => request("/api/me", AccountSchema, { signal }),
});
