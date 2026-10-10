import { capabilityIssues } from "./capabilities";
import { countByKind } from "./references";
import {
  type Generation,
  type GenerationRequest,
  GenerationSchema,
  GenerationsSchema,
  type Model,
  ModelsSchema,
  type Plan,
  type PlanRequest,
  PlanSchema,
  type Quote,
  type QuoteKind,
  type QuoteRequest,
  QuoteSchema,
  type Resolution,
} from "./schema";

const perSecond = {
  storyboard: 4,
  video: 6,
  image: 0,
  audio: 1,
  composition: 0,
  stitch: 0,
} satisfies Record<QuoteKind, number>;

const flat = {
  storyboard: 0,
  video: 0,
  image: 8,
  audio: 4,
  composition: 12,
  stitch: 6,
} satisfies Record<QuoteKind, number>;

const resolutionFactor = { "480p": 1, "720p": 1.5, "1080p": 2.5 } satisfies Record<
  Resolution,
  number
>;

/** Above this, the UI asks before spending (PRODUCT.md, proposed 200). */
const CONFIRM_ABOVE = 200;

/** Stand-in pricing until the backend quotes for real. */
export function quoteFixture({ mode, lengthSec, resolution, highQuality }: QuoteRequest): Quote {
  const base = flat[mode] + perSecond[mode] * lengthSec;
  const scaled = base * (resolution ? resolutionFactor[resolution] : 1) * (highQuality ? 2 : 1);
  const credits = Math.round(scaled);
  return QuoteSchema.parse({ credits, requiresConfirmation: credits > CONFIRM_ABOVE });
}

/** Sample capability matrix. Real capabilities come from the API, never assumed. */
export const modelsFixture: readonly Model[] = ModelsSchema.parse([
  {
    id: "seedance-pro",
    name: "Seedance Pro (sample)",
    vendor: "ByteDance",
    tabs: ["video"],
    capabilities: ["reference", "firstFrame", "lastFrame"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
  {
    id: "seedance-lite",
    name: "Seedance Lite (sample)",
    vendor: "ByteDance",
    tabs: ["video"],
    capabilities: ["reference", "firstFrame"],
    durations: [5, 10],
    resolutions: ["480p", "720p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
  {
    id: "toon-motion",
    name: "Toon Motion (sample)",
    vendor: "Toon Central",
    tabs: ["video"],
    capabilities: ["firstFrame", "lastFrame", "audio", "reference"],
    durations: [4, 8, 12],
    resolutions: ["720p"],
    aspectRatios: ["16:9", "9:16"],
  },
  {
    id: "toon-still",
    name: "Toon Still (sample)",
    vendor: "Toon Central",
    tabs: ["image", "composition"],
    capabilities: ["reference"],
    durations: [],
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
  {
    id: "toon-voice",
    name: "Toon Voice (sample)",
    vendor: "Toon Central",
    tabs: ["audio"],
    capabilities: ["audio"],
    durations: [5, 10, 30],
    resolutions: [],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
  {
    id: "toon-stitch",
    name: "Toon Stitch (sample)",
    vendor: "Toon Central",
    tabs: ["stitch"],
    capabilities: [],
    durations: [],
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
]);

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

/** In-memory store standing in for the backend, newest first. */
const generations: Generation[] = GenerationsSchema.parse([
  {
    id: "gen_drummer",
    tab: "video",
    prompt: "A talking drum player in Oshogbo, slow push in as the beat drops",
    modelName: "Seedance Pro (sample)",
    credits: 60,
    createdAt: minutesAgo(3),
    status: "generating",
    progress: 40,
  },
  {
    id: "gen_market",
    tab: "image",
    prompt: "Kaito haggling over ankara at Balogun market, midday glare",
    modelName: "Toon Still (sample)",
    credits: 8,
    createdAt: minutesAgo(25),
    status: "ready",
  },
  {
    id: "gen_harmattan",
    tab: "video",
    prompt: "Harmattan haze over Kano rooftops at dawn",
    modelName: "Seedance Lite (sample)",
    credits: 30,
    createdAt: minutesAgo(70),
    status: "failed",
    reason: "The model timed out.",
    creditsRefunded: 30,
  },
]);

export function listGenerations(): readonly Generation[] {
  return GenerationsSchema.parse(generations);
}

export type SubmitResult =
  | { readonly ok: true; readonly generation: Generation }
  | { readonly ok: false; readonly message: string };

/** Validate and enqueue one quick create job. Prices it the same way the quote does. */
export function submitGeneration(input: GenerationRequest): SubmitResult {
  const model = modelsFixture.find((candidate) => candidate.id === input.model) ?? null;
  if (input.model !== null && model === null) {
    return { ok: false, message: "That model is not available." };
  }
  if (model) {
    const issues = capabilityIssues(model, {
      tab: input.tab,
      videoInput: input.videoInput ?? "reference",
      referenceCounts: countByKind(
        input.references.map((ref, index) => ({ ...ref, id: String(index), url: "" })),
      ),
      hasFirstFrame: input.firstFrame !== null,
      hasLastFrame: input.lastFrame !== null,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      durationSec: input.durationSec,
    });
    const first = issues[0];
    if (first !== undefined) return { ok: false, message: first };
  }
  const quote = quoteFixture({
    mode: input.tab,
    aspectRatio: input.aspectRatio,
    lengthSec: input.durationSec ?? 1,
    ...(input.resolution ? { resolution: input.resolution } : {}),
  });
  const generation = GenerationSchema.parse({
    id: `gen_${crypto.randomUUID().slice(0, 8)}`,
    tab: input.tab,
    prompt: input.prompt,
    modelName: model?.name ?? null,
    credits: quote.credits,
    createdAt: new Date().toISOString(),
    status: "queued",
    positionInQueue: 1 + generations.filter((item) => item.status === "queued").length,
  });
  generations.unshift(generation);
  return { ok: true, generation };
}

/** Storyboards planned from an idea, by id. */
const plans = new Map<string, PlanRequest>();

export function createPlan(input: PlanRequest): Plan {
  const storyboardId = `sb_${crypto.randomUUID().slice(0, 8)}`;
  plans.set(storyboardId, input);
  const words = input.idea.trim().split(/\s+/).slice(0, 6).join(" ");
  return PlanSchema.parse({ storyboardId, title: words.charAt(0).toUpperCase() + words.slice(1) });
}

/** Put a failed generation back in the queue. Its refund already happened. */
export function retryGeneration(id: string): Generation | null {
  const index = generations.findIndex((item) => item.id === id);
  const current = generations[index];
  if (current?.status !== "failed") return null;
  const queued = GenerationSchema.parse({
    id: current.id,
    tab: current.tab,
    prompt: current.prompt,
    modelName: current.modelName,
    credits: current.credits,
    createdAt: new Date().toISOString(),
    status: "queued",
    positionInQueue: 1 + generations.filter((item) => item.status === "queued").length,
  });
  generations[index] = queued;
  return queued;
}
