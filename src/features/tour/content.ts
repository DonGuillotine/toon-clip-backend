import { z } from "zod";

import { CharacterSummarySchema, type CharacterSummary } from "@/features/characters/schema";
import { ShotSummarySchema, type ShotSummary } from "@/features/storyboards/schema";

/**
 * The onboarding tour (spec 7.1). Every word and every frame here is
 * pre-made sample content: the tour makes no generation calls and spends no
 * credits. It is static, so it is plain data rather than an API fixture.
 */

export const TOUR_STEPS: readonly ["1", "2", "3"] = ["1", "2", "3"];
export type TourStep = (typeof TOUR_STEPS)[number];

export const STEP_TITLES = {
  "1": "Character and idea",
  "2": "Magic Prompt",
  "3": "Result",
} satisfies Record<TourStep, string>;

/** The step after this one, or `null` on the last. */
export function nextStep(step: TourStep): TourStep | null {
  const index = TOUR_STEPS.indexOf(step);
  return TOUR_STEPS[index + 1] ?? null;
}

/** The step before this one, or `null` on the first. */
export function previousStep(step: TourStep): TourStep | null {
  const index = TOUR_STEPS.indexOf(step);
  return index <= 0 ? null : (TOUR_STEPS[index - 1] ?? null);
}

export const SAMPLE_CHARACTER: CharacterSummary = CharacterSummarySchema.parse({
  id: "tour_kaito",
  name: "Kaito",
  look: "Red headband, yellow vest, cobalt shadows",
  palette: ["#d83a2e", "#f4c430", "#1f3a8a", "#1b1b1f"],
  outfitCount: 2,
  expressionCount: 6,
  isSample: true,
});

export const SAMPLE_IDEA = "a man battling through an army of soldiers";

export const NoteKindSchema = z.enum(["camera", "lighting", "character", "action"]);
export const NOTE_KINDS = NoteKindSchema.options;
export type NoteKind = z.infer<typeof NoteKindSchema>;

/** A run of the improved prompt. `change` marks text Magic Prompt added. */
export type PromptSegment = { readonly text: string; readonly change: NoteKind | null };

export const IMPROVED_PROMPT: readonly PromptSegment[] = [
  { text: "Low-angle tracking shot, ", change: "camera" },
  { text: "Kaito in his red headband and yellow vest, jaw set, ", change: "character" },
  { text: "battles through an army of soldiers", change: null },
  {
    text: ", ducking a spear and shouldering two guards aside as the line breaks around him, ",
    change: "action",
  },
  {
    text: "torchlit courtyard at dusk, warm rim light against cobalt shadows.",
    change: "lighting",
  },
];

/** The improved prompt as one string. */
export function promptText(segments: readonly PromptSegment[]): string {
  return segments.map((segment) => segment.text).join("");
}

export const NOTES = {
  camera: {
    label: "Camera",
    note: "A low angle that tracks with Kaito makes the army feel huge and keeps him the centre.",
  },
  lighting: {
    label: "Lighting",
    note: "Torchlight and cobalt shadows come from his sheet's palette, so every shot matches.",
  },
  character: {
    label: "Character",
    note: "Naming his headband and vest anchors the model to the character sheet.",
  },
  action: {
    label: "Action",
    note: "Two concrete beats instead of 'battling' give the shot a start, a middle and an end.",
  },
} satisfies Record<NoteKind, { label: string; note: string }>;

/** The pre-made result's timeline: one shot is flagged, to show fixing just that one. */
export const DEMO_SHOTS: readonly ShotSummary[] = z.array(ShotSummarySchema).parse([
  { id: "t1", state: "ready", durationSec: 3 },
  { id: "t2", state: "ready", durationSec: 4 },
  { id: "t3", state: "flagged", durationSec: 3 },
  { id: "t4", state: "ready", durationSec: 5 },
]);

export const NEXT_STEPS: readonly string[] = [
  "Flag a shot that is not right, then regenerate only that shot.",
  "Compare takes side by side. Every take is kept.",
  "Lock the shots you like so nothing changes them.",
  "Export as layered PSD or as a finished video.",
];
