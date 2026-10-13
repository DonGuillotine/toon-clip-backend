import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { CharacterSheetSchema, CharactersSchema } from "./schema";

export const charactersQuery = queryOptions({
  queryKey: keys.characters.all(),
  queryFn: ({ signal }) => request("/api/characters", CharactersSchema, { signal }),
});

export const characterQuery = (id: string) =>
  queryOptions({
    queryKey: keys.characters.detail(id),
    queryFn: ({ signal }) =>
      request(`/api/characters/${encodeURIComponent(id)}`, CharacterSheetSchema, { signal }),
  });
