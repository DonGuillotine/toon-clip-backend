import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { CharactersSchema } from "./schema";

export const charactersQuery = queryOptions({
  queryKey: keys.characters.all(),
  queryFn: ({ signal }) => request("/api/characters", CharactersSchema, { signal }),
});
