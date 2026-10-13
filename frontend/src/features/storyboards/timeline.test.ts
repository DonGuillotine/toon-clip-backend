import { describe, expect, it } from "vitest";

import { storyboardDetailsFixture } from "./mocks";
import { StoryboardDetailSchema, type StoryboardDetail, type Take } from "./schema";
import { commandFor } from "./shortcuts";
import { filterStoryboards } from "./search";
import { recentStoryboardsFixture } from "./mocks";
import {
  applyAction,
  applyGenerate,
  completeJob,
  placeShots,
  restoreRevision,
  shotAt,
  shuttle,
  startJob,
  totalDuration,
} from "./timeline";
import { useTimelineStore } from "./timeline-store";

let counter = 0;
const newId = (prefix: string) => {
  counter += 1;
  return `${prefix}_${String(counter)}`;
};

function courtyard(): StoryboardDetail {
  const detail = storyboardDetailsFixture.find((item) => item.id === "sb_courtyard");
  if (!detail) throw new Error("fixture missing");
  return detail;
}

function shot(detail: StoryboardDetail, id: string) {
  const found = placeShots(detail).find((item) => item.shot.id === id);
  if (!found) throw new Error(`no shot ${id}`);
  return found.shot;
}

function ok(result: ReturnType<typeof applyAction>): StoryboardDetail {
  if (!result.ok) throw new Error(result.reason);
  return StoryboardDetailSchema.parse(result.detail);
}

describe("fixtures", () => {
  it("cover all six shot states and group shots into sheets of at most 15 seconds", () => {
    const states = new Set(
      storyboardDetailsFixture.flatMap((detail) =>
        placeShots(detail).map((item) => item.shot.state),
      ),
    );
    expect(states).toEqual(
      new Set(["queued", "generating", "ready", "flagged", "locked", "failed"]),
    );
    for (const detail of storyboardDetailsFixture) {
      for (const sheet of detail.sheets) {
        expect(sheet.shots.reduce((sum, item) => sum + item.durationSec, 0)).toBeLessThanOrEqual(
          15,
        );
      }
    }
  });
});

describe("placement", () => {
  it("lays shots end to end and finds the shot under the playhead", () => {
    const detail = courtyard();
    expect(totalDuration(detail)).toBe(42);
    expect(shotAt(detail, 0)?.shot.id).toBe("s1");
    expect(shotAt(detail, 6)?.shot.id).toBe("s2");
    expect(shotAt(detail, 999)?.shot.id).toBe("s6");
  });
});

describe("applyAction", () => {
  it("flags and clears a ready shot, and bumps the revision", () => {
    const detail = courtyard();
    const flagged = ok(applyAction(detail, { type: "flag", shotId: "s2", flagged: true }, newId));
    expect(shot(flagged, "s2").state).toBe("flagged");
    expect(flagged.revision).toBe(detail.revision + 1);
    const cleared = ok(applyAction(flagged, { type: "flag", shotId: "s2", flagged: false }, newId));
    expect(shot(cleared, "s2").state).toBe("ready");
  });

  it("refuses to flag a generating shot", () => {
    const result = applyAction(courtyard(), { type: "flag", shotId: "s3", flagged: true }, newId);
    expect(result.ok).toBe(false);
  });

  it("splits at an offset and keeps the takes on both halves", () => {
    const detail = courtyard();
    const before = shot(detail, "s2");
    const after = ok(applyAction(detail, { type: "split", shotId: "s2", atSec: 3 }, newId));
    const placed = placeShots(after);
    expect(placed).toHaveLength(placeShots(detail).length + 1);
    const index = placed.findIndex((item) => item.shot.id === "s2");
    expect(placed[index]?.shot.durationSec).toBe(3);
    expect(placed[index + 1]?.shot.durationSec).toBe(5);
    expect(placed[index + 1]?.shot.takes).toEqual(before.takes);
    expect(totalDuration(after)).toBe(totalDuration(detail));
  });

  it("refuses a split that would leave less than a second", () => {
    expect(applyAction(courtyard(), { type: "split", shotId: "s2", atSec: 0.5 }, newId).ok).toBe(
      false,
    );
  });

  it("refuses to split a locked shot", () => {
    expect(applyAction(courtyard(), { type: "split", shotId: "s1", atSec: 3 }, newId).ok).toBe(
      false,
    );
  });

  it("merges with the next shot in the sheet and keeps every take", () => {
    const detail = ok(applyAction(courtyard(), { type: "split", shotId: "s2", atSec: 3 }, newId));
    const takesBefore = placeShots(detail).reduce((sum, item) => sum + item.shot.takes.length, 0);
    const merged = ok(applyAction(detail, { type: "merge", shotId: "s2" }, newId));
    expect(shot(merged, "s2").durationSec).toBe(8);
    const takesAfter = placeShots(merged).reduce((sum, item) => sum + item.shot.takes.length, 0);
    expect(takesAfter).toBe(takesBefore);
  });

  it("selects a take, and refuses a take from another shot", () => {
    const detail = courtyard();
    const s2 = shot(detail, "s2");
    const first = s2.takes[0];
    if (!first) throw new Error("s2 has no takes");
    const selected = ok(
      applyAction(detail, { type: "selectTake", shotId: "s2", takeId: first.id }, newId),
    );
    expect(shot(selected, "s2").selectedTakeId).toBe(first.id);
    expect(
      applyAction(detail, { type: "selectTake", shotId: "s2", takeId: "nope" }, newId).ok,
    ).toBe(false);
  });

  it("duplicates a locked shot as an unlocked copy", () => {
    const after = ok(applyAction(courtyard(), { type: "duplicate", shotId: "s1" }, newId));
    const placed = placeShots(after);
    expect(placed[0]?.shot.state).toBe("locked");
    expect(placed[1]?.shot.state).toBe("ready");
  });
});

describe("generation", () => {
  const take: Take = {
    id: "new_take",
    number: 9,
    prompt: "p",
    notes: "hand looks wrong",
    settings: { model: "m", resolution: "1080p", durationSec: 8, seed: 1 },
    credits: 240,
    createdAt: new Date(0).toISOString(),
    art: "rush",
  };

  it("queues a regenerate, then the new take becomes the selected take and old takes stay", () => {
    const detail = courtyard();
    const before = shot(detail, "s2").takes.length;
    const queued = ok(applyGenerate(detail, "s2", "regenerate", "job_x", newId));
    expect(shot(queued, "s2").state).toBe("queued");
    const generating = startJob(queued, "job_x");
    expect(shot(generating, "s2").state).toBe("generating");
    const done = StoryboardDetailSchema.parse(
      completeJob(generating, "job_x", { status: "ready", take }),
    );
    const s2 = shot(done, "s2");
    expect(s2.state).toBe("ready");
    expect(s2.takes).toHaveLength(before + 1);
    expect(s2.selectedTakeId).toBe("new_take");
  });

  it("refuses to regenerate a locked shot", () => {
    expect(applyGenerate(courtyard(), "s1", "regenerate", "job_y", newId).ok).toBe(false);
  });

  it("records a refund on failure", () => {
    const queued = ok(applyGenerate(courtyard(), "s2", "regenerate", "job_z", newId));
    const failed = completeJob(queued, "job_z", {
      status: "failed",
      reason: "timeout",
      creditsRefunded: 240,
    });
    const s2 = shot(failed, "s2");
    expect(s2.state === "failed" ? s2.creditsRefunded : null).toBe(240);
  });

  it("continues from a shot with a new queued shot that starts on its last frame", () => {
    const detail = courtyard();
    const after = ok(applyGenerate(detail, "s2", "continue", "job_c", newId));
    const placed = placeShots(after);
    const index = placed.findIndex((item) => item.shot.id === "s2");
    const next = placed[index + 1]?.shot;
    expect(next?.state).toBe("queued");
    expect(next?.firstFrame).toEqual(shot(detail, "s2").lastFrame);
  });
});

describe("restoreRevision", () => {
  it("undoes an edit but keeps takes made since", () => {
    const original = courtyard();
    const flagged = ok(applyAction(original, { type: "flag", shotId: "s2", flagged: true }, newId));
    const queued = ok(applyGenerate(flagged, "s2", "regenerate", "job_r", newId));
    const extra: Take = {
      id: "since",
      number: 5,
      prompt: "p",
      notes: null,
      settings: { model: "m", resolution: "1080p", durationSec: 8, seed: 2 },
      credits: 240,
      createdAt: new Date(0).toISOString(),
      art: "dusk",
    };
    const done = completeJob(queued, "job_r", { status: "ready", take: extra });
    const restored = StoryboardDetailSchema.parse(restoreRevision(original, done));
    expect(shot(restored, "s2").takes.map((item) => item.id)).toContain("since");
  });
});

describe("shortcuts", () => {
  const press = (
    key: string,
    mods: Partial<{ shift: boolean; meta: boolean; ctrl: boolean }> = {},
  ) =>
    commandFor({
      key,
      shiftKey: mods.shift ?? false,
      metaKey: mods.meta ?? false,
      ctrlKey: mods.ctrl ?? false,
      altKey: false,
    });

  it("maps the documented keys", () => {
    expect(press(" ")).toBe("play");
    expect(press("j")).toBe("back");
    expect(press("k")).toBe("pause");
    expect(press("l")).toBe("forward");
    expect(press("L", { shift: true })).toBe("lock");
    expect(press("s")).toBe("split");
    expect(press("f")).toBe("flag");
    expect(press("r")).toBe("regenerate");
    expect(press("b")).toBe("board");
    expect(press("z", { meta: true })).toBe("undo");
    expect(press("z", { ctrl: true, shift: true })).toBe("redo");
    expect(press("x")).toBeNull();
    expect(press("s", { meta: true })).toBeNull();
  });

  it("shuttles faster on repeat and stops before reversing", () => {
    expect(shuttle(0, "l")).toBe(1);
    expect(shuttle(1, "l")).toBe(2);
    expect(shuttle(4, "l")).toBe(4);
    expect(shuttle(2, "j")).toBe(0);
    expect(shuttle(0, "j")).toBe(-1);
    expect(shuttle(-2, "k")).toBe(0);
  });
});

describe("search", () => {
  it("matches every word against title, idea and style", () => {
    expect(filterStoryboards(recentStoryboardsFixture, "lagos").map((item) => item.id)).toEqual([
      "sb_rooftop",
    ]);
    expect(filterStoryboards(recentStoryboardsFixture, "  ")).toHaveLength(
      recentStoryboardsFixture.length,
    );
    expect(filterStoryboards(recentStoryboardsFixture, "kaito torchlit")).toHaveLength(1);
  });
});

describe("timeline store", () => {
  it("moves entries between undo and redo, and a new edit clears redo", () => {
    const store = useTimelineStore.getState();
    store.open("a");
    store.record({ label: "Flag shot", before: 0, after: 1 });
    useTimelineStore.getState().undone();
    expect(useTimelineStore.getState().future).toHaveLength(1);
    useTimelineStore.getState().redone();
    expect(useTimelineStore.getState().past).toHaveLength(1);
    useTimelineStore.getState().undone();
    useTimelineStore.getState().record({ label: "Lock shot", before: 0, after: 2 });
    expect(useTimelineStore.getState().future).toHaveLength(0);
    useTimelineStore.getState().open("b");
    expect(useTimelineStore.getState().past).toHaveLength(0);
  });
});
