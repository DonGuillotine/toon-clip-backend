import { type AspectRatio } from "@/features/storyboards/schema";

import {
  type Capability,
  type Model,
  type QuickTab,
  type ReferenceKind,
  type Resolution,
  type VideoInput,
} from "./schema";

export const CAPABILITY_LABEL = {
  reference: "Reference",
  firstFrame: "First frame",
  lastFrame: "Last frame",
  audio: "Audio",
} satisfies Record<Capability, string>;

export function supports(model: Model, capability: Capability): boolean {
  return model.capabilities.includes(capability);
}

export type GenerationInputs = {
  readonly tab: QuickTab;
  readonly videoInput: VideoInput;
  readonly referenceCounts: Readonly<Record<ReferenceKind, number>>;
  readonly hasFirstFrame: boolean;
  readonly hasLastFrame: boolean;
  readonly aspectRatio: AspectRatio;
  readonly resolution: Resolution | null;
  readonly durationSec: number | null;
};

/**
 * Every reason the chosen model cannot run these inputs, as copy. An empty
 * list means the combination is supported. The API runs the same check.
 */
export function capabilityIssues(model: Model, inputs: GenerationInputs): readonly string[] {
  const issues: string[] = [];
  if (!model.tabs.includes(inputs.tab)) {
    issues.push(`${model.name} does not make this kind of output. Pick another model.`);
    return issues;
  }
  if (!model.aspectRatios.includes(inputs.aspectRatio)) {
    issues.push(`${model.name} cannot render ${inputs.aspectRatio}.`);
  }
  if (inputs.resolution !== null && !model.resolutions.includes(inputs.resolution)) {
    issues.push(`${model.name} cannot render at ${inputs.resolution}.`);
  }
  if (inputs.durationSec !== null && !model.durations.includes(inputs.durationSec)) {
    issues.push(`${model.name} cannot make a ${String(inputs.durationSec)} s clip.`);
  }
  if (inputs.tab !== "video") return issues;

  if (inputs.videoInput === "reference") {
    const total =
      inputs.referenceCounts.image + inputs.referenceCounts.video + inputs.referenceCounts.audio;
    if (total > 0 && !supports(model, "reference")) {
      issues.push(
        `${model.name} does not take reference files. Switch to Frame mode or a model with Reference.`,
      );
    }
    if (inputs.referenceCounts.audio > 0 && !supports(model, "audio")) {
      issues.push(
        `${model.name} cannot use audio references. Remove them or pick a model with Audio.`,
      );
    }
  } else {
    if (inputs.hasFirstFrame && !supports(model, "firstFrame")) {
      issues.push(`${model.name} cannot start from a first frame.`);
    }
    if (inputs.hasLastFrame && !supports(model, "lastFrame")) {
      issues.push(
        `${model.name} cannot end on a last frame. Clear it or pick a model with Last frame.`,
      );
    }
  }
  return issues;
}

/** Ratio of an aspect like "16:9" as a number. */
export function aspectValue(aspect: AspectRatio): number {
  const [w, h] = aspect.split(":").map(Number);
  if (w === undefined || h === undefined || h === 0) return 1;
  return w / h;
}

/**
 * True when an image of this size would be cropped to fit the output aspect.
 * A 2% tolerance absorbs rounding in exported frame sizes.
 */
export function needsCrop(width: number, height: number, output: AspectRatio): boolean {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return Math.abs(ratio - aspectValue(output)) / aspectValue(output) > 0.02;
}
