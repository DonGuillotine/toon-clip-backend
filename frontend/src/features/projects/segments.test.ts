import { describe, expect, it } from "vitest";

import { formatClock, parseBeats } from "@/features/catalog/beats";

import {
  addCut,
  beatCuts,
  joinWithNext,
  parseCutMap,
  segmentAt,
  segmentsOf,
  serialiseCutMap,
} from "./segments";

const PROMPT = [
  "BIG CHIEF is @Image 1",
  "0:00–0:03",
  "Visual: He stands grinning on a cliff.",
  "Camera: Slow push-in on his grin.",
  "0:03 - 0:06",
  "Visual: He plummets toward the ground.",
  "A flash of gold.",
  "0:06–0:15",
  "Mood: Triumphant.",
].join("\n");

describe("parseBeats", () => {
  it("reads the lead, each time range and its fields", () => {
    const parsed = parseBeats(PROMPT);
    expect(parsed.lead).toBe("BIG CHIEF is @Image 1");
    expect(parsed.beats.map((beat) => [beat.startSeconds, beat.endSeconds])).toEqual([
      [0, 3],
      [3, 6],
      [6, 15],
    ]);
    expect(parsed.beats[0]?.fields).toEqual([
      { label: "Visual", text: "He stands grinning on a cliff." },
      { label: "Camera", text: "Slow push-in on his grin." },
    ]);
    expect(parsed.beats[1]?.notes).toEqual(["A flash of gold."]);
  });

  it("finds no beats in a plain prompt", () => {
    const parsed = parseBeats("a man battling through an army of soldiers");
    expect(parsed.beats).toHaveLength(0);
    expect(parsed.lead).toBe("a man battling through an army of soldiers");
  });
});

describe("formatClock", () => {
  it("prints whole and fractional seconds", () => {
    expect(formatClock(3)).toBe("0:03");
    expect(formatClock(6.5)).toBe("0:06.5");
    expect(formatClock(75.04)).toBe("1:15");
  });
});

describe("cuts and segments", () => {
  it("splits a shot into segments between its cuts", () => {
    expect(segmentsOf(15, [6, 3])).toEqual([
      { number: 1, startSeconds: 0, endSeconds: 3 },
      { number: 2, startSeconds: 3, endSeconds: 6 },
      { number: 3, startSeconds: 6, endSeconds: 15 },
    ]);
    expect(segmentsOf(15, [])).toHaveLength(1);
  });

  it("adds a cut at the playhead, rounded to a tenth", () => {
    expect(addCut([3], 7.234, 15)).toEqual({ ok: true, cuts: [3, 7.2] });
  });

  it("refuses a cut that would leave a sliver or repeat a cut", () => {
    expect(addCut([3], 3.2, 15).ok).toBe(false);
    expect(addCut([3], 3, 15).ok).toBe(false);
    expect(addCut([], 14.8, 15).ok).toBe(false);
  });

  it("joins a segment with the next one", () => {
    const [first, , last] = segmentsOf(15, [3, 6]);
    if (first === undefined || last === undefined) throw new Error("missing segments");
    expect(joinWithNext([3, 6], first, 15)).toEqual({ ok: true, cuts: [6] });
    expect(joinWithNext([3, 6], last, 15).ok).toBe(false);
  });

  it("finds the segment at a time, with the very end in the last one", () => {
    const segments = segmentsOf(15, [3]);
    expect(segmentAt(segments, 2.9)?.number).toBe(1);
    expect(segmentAt(segments, 3)?.number).toBe(2);
    expect(segmentAt(segments, 15)?.number).toBe(2);
  });

  it("cuts on the prompt's beats, scaled to the clip", () => {
    const { beats } = parseBeats(PROMPT);
    expect(beatCuts(beats, 15.04)).toEqual([3, 6]);
    expect(beatCuts([], 15)).toEqual([]);
  });
});

describe("cut map in the URL", () => {
  it("round-trips", () => {
    const map = { "full-clip": [3, 6.5], other: [2] };
    expect(parseCutMap(serialiseCutMap(map))).toEqual(map);
  });

  it("drops what it cannot read", () => {
    expect(parseCutMap("bad id!:3;ok:x,4")).toEqual({ ok: [4] });
    expect(parseCutMap("")).toBeNull();
  });
});
