import { queryOptions } from "@tanstack/react-query";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import {
  type AudioClip,
  AudioLibrarySchema,
  type AudioQuoteRequest,
  AudioQuoteSchema,
  type MusicMagicPromptRequest,
  MusicMagicPromptResultSchema,
} from "./schema";

const POLL_MS = 1_000;

/** True while any clip is still moving, so polling stops when all settle. */
export function hasActiveClip(clips: readonly AudioClip[]): boolean {
  return clips.some((clip) => clip.status === "queued" || clip.status === "generating");
}

export const audioLibraryQuery = queryOptions({
  queryKey: keys.audio.library(),
  queryFn: ({ signal }) => request("/api/audio", AudioLibrarySchema, { signal }),
  // Generation moves on its own; poll only while a clip is in flight.
  refetchInterval: (query) =>
    query.state.data && hasActiveClip(query.state.data.clips) ? POLL_MS : false,
});

/** Search params for a quote. Numbers become strings on the wire. */
function quoteParams(input: AudioQuoteRequest): string {
  const params =
    input.kind === "music"
      ? { kind: input.kind, durationSec: String(input.durationSec) }
      : { kind: input.kind, characters: String(input.characters) };
  return new URLSearchParams(params).toString();
}

export const audioQuoteQuery = (input: AudioQuoteRequest) =>
  queryOptions({
    queryKey: keys.audio.quote(input),
    queryFn: ({ signal }) =>
      request(`/api/audio/quote?${quoteParams(input)}`, AudioQuoteSchema, { signal }),
    placeholderData: (previous) => previous,
  });

/** A suggestion is a read: the same input gives the same suggestion, so it caches. */
export const musicMagicPromptQuery = (input: MusicMagicPromptRequest) =>
  queryOptions({
    queryKey: keys.audio.magicPrompt(input),
    queryFn: ({ signal }) =>
      request("/api/audio/magic-prompt", MusicMagicPromptResultSchema, {
        method: "POST",
        body: input,
        signal,
      }),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
