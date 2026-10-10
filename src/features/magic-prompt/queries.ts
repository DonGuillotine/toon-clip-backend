import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { type MagicPromptRequest, MagicPromptResultSchema } from "./schema";

/**
 * A suggestion is a read, not a write: the same prompt, strength and attempt
 * give the same suggestion, so it caches. "Try another" bumps `attempt`.
 */
export const magicPromptQuery = (input: MagicPromptRequest) =>
  queryOptions({
    queryKey: keys.magicPrompt.suggestion(input),
    queryFn: ({ signal }) =>
      request("/api/magic-prompt", MagicPromptResultSchema, {
        method: "POST",
        body: input,
        signal,
      }),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
