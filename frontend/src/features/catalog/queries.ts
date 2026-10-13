import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { CatalogSchema, PromptPreviewSchema } from "./schema";

/** The published examples and the prices. */
export const catalogQuery = queryOptions({
  queryKey: keys.catalog.all(),
  queryFn: ({ signal }) => request("/api/v1/catalog", CatalogSchema, { signal }),
  // Media links inside are signed and expire after fifteen minutes; refresh
  // well before they do, even while a page sits open.
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
});

/**
 * Magic Prompt for one choice: the saved original and improved prompts with
 * the reason for each change. A POST in the API, but a free, repeatable read.
 */
export const promptPreviewQuery = (scenarioId: string, selectionId: string) =>
  queryOptions({
    queryKey: keys.catalog.promptPreview(scenarioId, selectionId),
    queryFn: ({ signal }) =>
      request("/api/v1/prompt-previews", PromptPreviewSchema, {
        method: "POST",
        body: { scenarioId, selectionId },
        signal,
      }),
    staleTime: Infinity,
  });
