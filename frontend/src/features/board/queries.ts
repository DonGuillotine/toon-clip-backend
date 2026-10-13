import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { BoardQuoteSchema, BoardSchema } from "./schema";

export const boardQuery = (storyboardId: string) =>
  queryOptions({
    queryKey: keys.board.detail(storyboardId),
    queryFn: ({ signal }) =>
      request(`/api/boards/${encodeURIComponent(storyboardId)}`, BoardSchema, { signal }),
  });

export const boardQuoteQuery = (storyboardId: string, nodeIds: readonly string[]) =>
  queryOptions({
    queryKey: keys.board.quote(storyboardId, nodeIds),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ nodes: nodeIds.join(",") });
      return request(
        `/api/boards/${encodeURIComponent(storyboardId)}/quote?${params.toString()}`,
        BoardQuoteSchema,
        { signal },
      );
    },
    enabled: nodeIds.length > 0,
    placeholderData: (previous) => previous,
  });
