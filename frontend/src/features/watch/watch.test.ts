import { describe, expect, it } from "vitest";

import { listGenerations } from "@/features/create/mocks";
import { storyboardDetailsFixture } from "@/features/storyboards/mocks";

import { buildWatchLibrary, storyboardToWatchItem } from "./library";
import { captionsFixture } from "./mocks";
import { advance, clampTime, describeRate, segmentAt, shuttle } from "./playback";
import { WatchLibrarySchema } from "./schema";
import { playerCommandFor } from "./shortcuts";

const key = (value: string) => ({
  key: value,
  shiftKey: false,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
});

describe("watch library", () => {
  const library = buildWatchLibrary(storyboardDetailsFixture, listGenerations(), captionsFixture);

  it("parses against its own contract", () => {
    expect(() => WatchLibrarySchema.parse(library)).not.toThrow();
  });

  it("leaves out storyboards with no finished shot", () => {
    // The night bus storyboard is entirely queued in the fixtures.
    expect(library.some((item) => item.id === "sb_nightbus")).toBe(false);
  });

  it("skips unfinished shots and keeps segments contiguous", () => {
    const courtyard = storyboardDetailsFixture.find((detail) => detail.id === "sb_courtyard");
    if (!courtyard) throw new Error("fixture missing");
    const item = storyboardToWatchItem(courtyard, captionsFixture);
    if (!item) throw new Error("expected a watch item");
    // Six shots, one generating and one queued.
    expect(item.segments).toHaveLength(4);
    expect(item.skippedShots).toBe(2);
    let cursor = 0;
    for (const segment of item.segments) {
      expect(segment.startSec).toBe(cursor);
      cursor += segment.durationSec;
    }
    expect(item.durationSec).toBe(cursor);
  });

  it("carries captions by shot position", () => {
    const courtyard = library.find((item) => item.id === "sb_courtyard");
    expect(courtyard?.segments[0]?.caption).toBe("Kaito: Open the gate. I will not ask twice.");
  });

  it("only includes ready, non-audio generations", () => {
    for (const item of library.filter((entry) => entry.kind === "generation")) {
      const source = listGenerations().find((generation) => generation.id === item.id);
      expect(source?.status).toBe("ready");
      expect(source?.tab).not.toBe("audio");
    }
  });

  it("sorts newest first", () => {
    const times = library.map((item) => Date.parse(item.updatedAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe("playback", () => {
  const segments = [
    { id: "a", label: "A", startSec: 0, durationSec: 4, art: "burst", caption: null },
    { id: "b", label: "B", startSec: 4, durationSec: 6, art: "rush", caption: "Hi" },
  ] satisfies Parameters<typeof segmentAt>[0];

  it("finds the segment under the playhead", () => {
    expect(segmentAt(segments, 0)?.segment.id).toBe("a");
    expect(segmentAt(segments, 3.99)?.segment.id).toBe("a");
    expect(segmentAt(segments, 4)?.segment.id).toBe("b");
  });

  it("keeps the last segment at the very end", () => {
    expect(segmentAt(segments, 10)?.index).toBe(1);
    expect(segmentAt([], 1)).toBeNull();
  });

  it("clamps time into the clip", () => {
    expect(clampTime(-2, 10)).toBe(0);
    expect(clampTime(12, 10)).toBe(10);
    expect(clampTime(Number.NaN, 10)).toBe(0);
  });

  it("advances by real elapsed time and rate", () => {
    expect(advance(1, 1, 500, 10)).toEqual({ timeSec: 1.5, ended: false });
    expect(advance(1, 2, 500, 10)).toEqual({ timeSec: 2, ended: false });
    expect(advance(9.9, 1, 500, 10)).toEqual({ timeSec: 10, ended: true });
    expect(advance(0.2, -4, 500, 10)).toEqual({ timeSec: 0, ended: true });
  });

  it("shuttles up to 4x and restarts on a change of direction", () => {
    expect(shuttle(0, "forward")).toBe(1);
    expect(shuttle(1, "forward")).toBe(2);
    expect(shuttle(2, "forward")).toBe(4);
    expect(shuttle(4, "forward")).toBe(4);
    expect(shuttle(4, "backward")).toBe(-1);
    expect(shuttle(-1, "backward")).toBe(-2);
  });

  it("describes the rate in words", () => {
    expect(describeRate(0)).toBe("Paused");
    expect(describeRate(1)).toBe("Playing");
    expect(describeRate(2)).toBe("Playing at 2x");
    expect(describeRate(-4)).toBe("Rewinding at 4x");
  });
});

describe("player shortcuts", () => {
  it("maps the J K L and arrow keys", () => {
    expect(playerCommandFor(key(" "))).toBe("play");
    expect(playerCommandFor(key("j"))).toBe("back");
    expect(playerCommandFor(key("K"))).toBe("pause");
    expect(playerCommandFor(key("l"))).toBe("forward");
    expect(playerCommandFor(key("ArrowLeft"))).toBe("stepBack");
    expect(playerCommandFor(key("ArrowRight"))).toBe("stepForward");
    expect(playerCommandFor(key("c"))).toBe("captions");
    expect(playerCommandFor(key("f"))).toBe("fullscreen");
  });

  it("ignores modified keys so browser shortcuts still work", () => {
    expect(playerCommandFor({ ...key("f"), metaKey: true })).toBeNull();
    expect(playerCommandFor({ ...key("l"), shiftKey: true })).toBeNull();
    expect(playerCommandFor(key("x"))).toBeNull();
  });
});
