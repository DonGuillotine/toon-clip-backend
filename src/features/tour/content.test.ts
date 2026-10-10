import { describe, expect, it } from "vitest";

import {
  DEMO_SHOTS,
  IMPROVED_PROMPT,
  NOTE_KINDS,
  nextStep,
  previousStep,
  promptText,
  SAMPLE_IDEA,
} from "./content";

describe("tour content", () => {
  it("walks the three steps in order", () => {
    expect(nextStep("1")).toBe("2");
    expect(nextStep("3")).toBeNull();
    expect(previousStep("1")).toBeNull();
    expect(previousStep("3")).toBe("2");
  });

  it("keeps the lazy idea inside the improved prompt", () => {
    expect(promptText(IMPROVED_PROMPT)).toContain(
      SAMPLE_IDEA.slice(SAMPLE_IDEA.indexOf("an army")),
    );
  });

  it("has a highlighted change for each of the four notes", () => {
    const changes = new Set(IMPROVED_PROMPT.map((segment) => segment.change));
    for (const kind of NOTE_KINDS) expect(changes.has(kind)).toBe(true);
  });

  it("shows exactly one flagged shot", () => {
    expect(DEMO_SHOTS.filter((shot) => shot.state === "flagged")).toHaveLength(1);
  });
});
