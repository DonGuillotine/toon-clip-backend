import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { QuoteSchema, type QuoteRequest } from "./schema";

export const quoteQuery = (input: QuoteRequest) =>
  queryOptions({
    queryKey: keys.create.quote(input),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        mode: input.mode,
        aspectRatio: input.aspectRatio,
        lengthSec: String(input.lengthSec),
      });
      return request(`/api/quote?${params.toString()}`, QuoteSchema, { signal });
    },
    placeholderData: (previous) => previous,
  });
