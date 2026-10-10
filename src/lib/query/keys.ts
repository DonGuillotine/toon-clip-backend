/**
 * Query key factories. Every key in the app is built here and nowhere else,
 * so two call sites can never disagree about what a key looks like.
 */
import { type QueryKey } from "@tanstack/react-query";

import { type QuoteRequest } from "@/features/create/schema";
import { type GenerationKind } from "@/features/storyboards/schema";
import { type MagicPromptRequest } from "@/features/magic-prompt/schema";
import { type ExportQuoteRequest } from "@/features/export/schema";

export const keys = {
  account: {
    all: () => ["account"] satisfies QueryKey,
    me: () => ["account", "me"] satisfies QueryKey,
    ledger: () => ["account", "ledger"] satisfies QueryKey,
    recipes: () => ["account", "recipes"] satisfies QueryKey,
    creditPacks: () => ["account", "credit-packs"] satisfies QueryKey,
  },
  storyboards: {
    all: () => ["storyboards"] satisfies QueryKey,
    recent: () => ["storyboards", "recent"] satisfies QueryKey,
  },
  characters: {
    all: () => ["characters"] satisfies QueryKey,
    detail: (id: string) => ["characters", "detail", id] satisfies QueryKey,
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
  exports: {
    all: () => ["exports"] satisfies QueryKey,
    list: (storyboardId: string) => ["exports", "list", storyboardId] satisfies QueryKey,
    quote: (input: ExportQuoteRequest) =>
      ["exports", "quote", input.storyboardId, input.kind] satisfies QueryKey,
  },
  board: {
    detail: (storyboardId: string) => ["board", storyboardId] satisfies QueryKey,
    quote: (storyboardId: string, nodeIds: readonly string[]) =>
      ["board", storyboardId, "quote", ...nodeIds] satisfies QueryKey,
  },
  desk: {
    library: () => ["desk", "library"] satisfies QueryKey,
  },
  watch: {
    library: () => ["watch", "library"] satisfies QueryKey,
  },
  gallery: {
    state: () => ["gallery"] satisfies QueryKey,
  },
};
