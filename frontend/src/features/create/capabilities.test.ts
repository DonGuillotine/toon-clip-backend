import { describe, expect, it } from "vitest";

import { capabilityIssues, type GenerationInputs, needsCrop } from "./capabilities";
import { modelsFixture, quoteFixture, submitGeneration } from "./mocks";
import { type Model } from "./schema";

function model(id: string): Model {
  const found = modelsFixture.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No fixture model ${id}`);
  return found;
}

const base: GenerationInputs = {
  tab: "video",
  videoInput: "frames",
  referenceCounts: { image: 0, video: 0, audio: 0 },
  hasFirstFrame: true,
  hasLastFrame: false,
  aspectRatio: "16:9",
  resolution: "720p",
  durationSec: 5,
};

describe("capabilityIssues", () => {
  it("accepts a supported combination", () => {
    expect(capabilityIssues(model("seedance-pro"), base)).toEqual([]);
  });

  it("rejects a last frame on a model without it", () => {
    const issues = capabilityIssues(model("seedance-lite"), { ...base, hasLastFrame: true });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/last frame/);
  });

  it("rejects audio references, durations and resolutions the model lacks", () => {
    const issues = capabilityIssues(model("seedance-pro"), {
      ...base,
      videoInput: "reference",
      referenceCounts: { image: 1, video: 0, audio: 1 },
      durationSec: 30,
    });
    expect(issues).toHaveLength(2);
    expect(capabilityIssues(model("seedance-lite"), { ...base, resolution: "1080p" })).toHaveLength(
      1,
    );
  });

  it("rejects a model for the wrong tab", () => {
    expect(capabilityIssues(model("toon-voice"), base)).toHaveLength(1);
  });
});

describe("needsCrop", () => {
  it("allows a matching shape and flags a different one", () => {
    expect(needsCrop(1920, 1080, "16:9")).toBe(false);
    expect(needsCrop(1080, 1920, "16:9")).toBe(true);
    expect(needsCrop(1000, 1000, "1:1")).toBe(false);
  });
});

describe("fixture API", () => {
  it("prices on the server and asks to confirm large spends", () => {
    expect(quoteFixture({ mode: "storyboard", aspectRatio: "16:9", lengthSec: 30 })).toEqual({
      credits: 120,
      requiresConfirmation: false,
    });
    expect(
      quoteFixture({ mode: "storyboard", aspectRatio: "16:9", lengthSec: 30, highQuality: true }),
    ).toEqual({ credits: 240, requiresConfirmation: true });
  });

  it("refuses an unsupported generation", () => {
    const result = submitGeneration({
      tab: "video",
      prompt: "Kaito leaps",
      model: "seedance-lite",
      aspectRatio: "16:9",
      resolution: "720p",
      durationSec: 5,
      videoInput: "frames",
      references: [],
      firstFrame: "a.png",
      lastFrame: "b.png",
    });
    expect(result.ok).toBe(false);
  });
});
