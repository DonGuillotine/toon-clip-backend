/**
 * Query key factories. Every key in the app is built here and nowhere else,
 * so two call sites can never disagree about what a key looks like.
 */
import { type QueryKey } from "@tanstack/react-query";

import { type QuoteRequest } from "@/features/create/schema";
import { type GenerationKind } from "@/features/storyboards/schema";
import { type MagicPromptRequest } from "@/features/magic-prompt/schema";

export const keys = {
  account: {
    me: () => ["account", "me"] satisfies QueryKey,
  },
  storyboards: {
    all: () => ["storyboards"] satisfies QueryKey,
    recent: () => ["storyboards", "recent"] satisfies QueryKey,
  },
  characters: {
    all: () => ["characters"] satisfies QueryKey,
  },
  jobs: {
    active: () => ["jobs", "active"] satisfies QueryKey,
  },
  create: {
    quote: (input: QuoteRequest) => ["create", "quote", input] satisfies QueryKey,
  },
  models: {
    all: () => ["models"] satisfies QueryKey,
  },
  generations: {
    recent: () => ["generations", "recent"] satisfies QueryKey,
  },
  magicPrompt: {
    suggestion: (input: MagicPromptRequest) => ["magic-prompt", input] satisfies QueryKey,
  },
  timeline: {
    all: (storyboardId: string) => ["timeline", storyboardId] satisfies QueryKey,
    detail: (storyboardId: string) => ["timeline", storyboardId, "detail"] satisfies QueryKey,
    job: (storyboardId: string, jobId: string) =>
      ["timeline", storyboardId, "job", jobId] satisfies QueryKey,
    quote: (storyboardId: string, shotId: string, kind: GenerationKind) =>
      ["timeline", storyboardId, "quote", shotId, kind] satisfies QueryKey,
  },
};
