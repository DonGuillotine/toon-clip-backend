import { describe, expect, it } from "vitest";

import { continuityNotes } from "./continuity";
import { storyboardDetailsFixture } from "./mocks";
import { placeShots } from "./timeline";

function placed(id: string) {
  const detail = storyboardDetailsFixture.find((item) => item.id === id);
  if (!detail) throw new Error(`Missing fixture ${id}`);
  return placeShots(detail);
}

describe("continuityNotes", () => {
  it("suggests a fix when neighbouring shots disagree on time of day", () => {
    const notes = continuityNotes(placed("sb_courtyard"));
    const time = notes.find((note) => note.kind === "time");
    expect(time?.message).toMatch(/"dusk".*"night"/);
    expect(time?.suggestedPrompt).toMatch(/at dusk/);
    expect(time?.suggestedPrompt).not.toMatch(/night/);
  });

  it("stays quiet when nothing disagrees", () => {
    expect(continuityNotes(placed("sb_nightbus"))).toEqual([]);
  });

  it("ignores costume differences between shots with no shared character", () => {
    const [first, second] = placed("sb_courtyard");
    if (!first || !second) throw new Error("Expected two shots");
    const notes = continuityNotes([
      { ...first, shot: { ...first.shot, prompt: "In a vest", characterIds: ["a"] } },
      { ...second, shot: { ...second.shot, prompt: "In a jacket", characterIds: ["b"] } },
    ]);
    expect(notes).toEqual([]);
  });
});
