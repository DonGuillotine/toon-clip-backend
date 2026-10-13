import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { GenerationsSchema, ModelsSchema, QuoteSchema, type QuoteRequest } from "./schema";

export const quoteQuery = (input: QuoteRequest) =>
  queryOptions({
    queryKey: keys.create.quote(input),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        mode: input.mode,
        aspectRatio: input.aspectRatio,
        lengthSec: String(input.lengthSec),
      });
      if (input.model !== undefined) params.set("model", input.model);
      if (input.resolution !== undefined) params.set("resolution", input.resolution);
      if (input.highQuality !== undefined) params.set("highQuality", String(input.highQuality));
      return request(`/api/quote?${params.toString()}`, QuoteSchema, { signal });
    },
    placeholderData: (previous) => previous,
  });

export const modelsQuery = queryOptions({
  queryKey: keys.models.all(),
  queryFn: ({ signal }) => request("/api/models", ModelsSchema, { signal }),
  staleTime: 10 * 60 * 1000,
});

export const generationsQuery = queryOptions({
  queryKey: keys.generations.recent(),
  queryFn: ({ signal }) => request("/api/generations", GenerationsSchema, { signal }),
  // Generations move on their own; poll while anything is in flight.
  refetchInterval: (query) =>
    query.state.data?.some((item) => item.status === "queued" || item.status === "generating")
      ? 5_000
      : false,
});
