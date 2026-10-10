import { describe, expect, it } from "vitest";

import { charactersFixture } from "@/features/characters/mocks";

import { improvePrompt } from "./mocks";
import { type MagicPromptRequest } from "./schema";

const kaito = charactersFixture.filter((character) => character.id === "ch_kaito");

describe("improvePrompt", () => {
  it("replaces vague words and explains each change", () => {
    const result = improvePrompt(
      {
        prompt: "an epic scene of a man battling through an army of soldiers, 4k",
        strength: "standard",
        characterIds: ["ch_kaito"],
        attempt: 0,
      },
      kaito,
    );
    if (result.status !== "improved") throw new Error("Expected an improvement");
    expect(result.improved).not.toMatch(/epic|4k/i);
    expect(result.improved).toMatch(/Kaito/);
    expect(result.changes.every((change) => change.reason.length > 0)).toBe(true);
    const marked = result.original.filter((segment) => segment.change !== null);
    expect(marked.map((segment) => segment.text.trim())).toContain("epic");
    expect(result.warnings).toEqual([]);
  });

  it("warns without a character sheet and lists assumptions for short input", () => {
    const result = improvePrompt(
      { prompt: "drummer at night", strength: "light", characterIds: [], attempt: 0 },
      [],
    );
    if (result.status !== "improved") throw new Error("Expected an improvement");
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/character sheet/);
  });

  it("gives a different suggestion on another attempt", () => {
    const input: MagicPromptRequest = {
      prompt: "an epic dance",
      strength: "standard",
      characterIds: [],
      attempt: 0,
    };
    const first = improvePrompt(input, []);
    const second = improvePrompt({ ...input, attempt: 1 }, []);
    if (first.status !== "improved" || second.status !== "improved") throw new Error("Expected");
    expect(first.improved).not.toBe(second.improved);
  });

  it("declines a disallowed request plainly", () => {
    const result = improvePrompt(
      { prompt: "a gory beheading", strength: "standard", characterIds: [], attempt: 0 },
      [],
    );
    expect(result.status).toBe("declined");
  });
});

describe("article agreement", () => {
  it("keeps a and an agreeing after a replacement", () => {
    const result = improvePrompt(
      {
        prompt: "an epic man running in a market at noon",
        strength: "light",
        characterIds: [],
        attempt: 0,
      },
      [],
    );
    if (result.status !== "improved") throw new Error("Expected an improvement");
    expect(result.improved.startsWith("a dust-swept, low-angle man")).toBe(true);
  });
});
