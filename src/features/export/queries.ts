import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import {
  type ExportJob,
  type ExportQuoteRequest,
  ExportQuoteSchema,
  ExportsResponseSchema,
} from "./schema";

const POLL_MS = 2_000;

/** True while any export is still moving, so polling can stop when all settle. */
export function hasActiveExport(exports: readonly ExportJob[]): boolean {
  return exports.some((job) => job.status === "preparing" || job.status === "rendering");
}

export const exportsQuery = (storyboardId: string) =>
  queryOptions({
    queryKey: keys.exports.list(storyboardId),
    queryFn: ({ signal }) =>
      request(
        `/api/exports?${new URLSearchParams({ storyboardId }).toString()}`,
        ExportsResponseSchema,
        { signal },
      ),
    // Renders move on their own; poll only while one is in flight.
    refetchInterval: (query) =>
      query.state.data && hasActiveExport(query.state.data.exports) ? POLL_MS : false,
  });

export const exportQuoteQuery = (input: ExportQuoteRequest) =>
  queryOptions({
    queryKey: keys.exports.quote(input),
    queryFn: ({ signal }) =>
      request(`/api/exports/quote?${new URLSearchParams(input).toString()}`, ExportQuoteSchema, {
        signal,
      }),
  });
