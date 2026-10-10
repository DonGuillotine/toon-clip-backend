import { queryOptions } from "@tanstack/react-query";

import { ApiError, request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { hasActiveWork } from "./page";
import { ComicListSchema, ComicPageSchema, PanelQuoteSchema } from "./schema";

const POLL_MS = 1_000;

/** A 404 will not fix itself; anything else gets the default retries. */
const retryUnlessMissing = (count: number, error: Error): boolean =>
  !(error instanceof ApiError && error.status === 404) && count < 3;

export const comicListQuery = queryOptions({
  queryKey: keys.comics.list(),
  queryFn: ({ signal }) => request("/api/comics", ComicListSchema, { signal }),
});

export const comicPageQuery = (pageId: string) =>
  queryOptions({
    queryKey: keys.comics.detail(pageId),
    queryFn: ({ signal }) =>
      request(`/api/comics/${encodeURIComponent(pageId)}`, ComicPageSchema, { signal }),
    retry: retryUnlessMissing,
    // Panels and exports move on their own; poll only while one is in flight.
    refetchInterval: (query) =>
      query.state.data && hasActiveWork(query.state.data) ? POLL_MS : false,
  });

export const panelQuoteQuery = (pageId: string, panelId: string) =>
  queryOptions({
    queryKey: keys.comics.quote(pageId, panelId),
    queryFn: ({ signal }) =>
      request(
        `/api/comics/${encodeURIComponent(pageId)}/panels/${encodeURIComponent(panelId)}/quote`,
        PanelQuoteSchema,
        { signal },
      ),
  });
