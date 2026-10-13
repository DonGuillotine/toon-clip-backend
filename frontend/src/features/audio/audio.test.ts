import { describe, expect, it } from "vitest";

import { describeProgress } from "./announce";
import {
  advanceClip,
  type ClipRecord,
  newClipRecord,
  QUEUED_FOR_MS,
  quoteAudio,
  titleFrom,
} from "./mocks";
import { improveMusicPrompt } from "./music-magic";
import { advancePosition } from "./playback-store";
import { type AudioClip, AudioQuoteRequestSchema, type MusicMagicPromptRequest } from "./schema";
import { playedBars, waveform } from "./waveform";

const T0 = 1_800_000_000_000;

function record(overrides: Partial<ClipRecord> = {}): ClipRecord {
  return {
    ...newClipRecord(
      { kind: "music", prompt: "drums build", genre: "afrobeats", mood: "tense", durationSec: 30 },
      null,
      { id: "au_test", now: T0, fails: false },
    ),
    ...overrides,
  };
}

describe("advanceClip", () => {
  it("moves queued, generating with progress, then ready", () => {
    expect(advanceClip(record(), T0).status).toBe("queued");
    const halfway = advanceClip(record(), T0 + QUEUED_FOR_MS + 5_000);
    expect(halfway).toMatchObject({ status: "generating", progress: 50 });
    expect(advanceClip(record(), T0 + 60_000).status).toBe("ready");
  });

  it("fails with a reason and refunds the credits", () => {
    const failed = advanceClip(record({ failWith: "Timed out." }), T0 + 60_000);
    expect(failed).toMatchObject({ status: "failed", reason: "Timed out.", refunded: 60 });
  });
});

describe("quoteAudio", () => {
  it("prices music by length and asks above the threshold", () => {
    expect(quoteAudio({ kind: "music", durationSec: 30 })).toEqual({
      credits: 60,
      requiresConfirmation: false,
    });
    expect(quoteAudio({ kind: "music", durationSec: 180 }).requiresConfirmation).toBe(true);
  });

  it("prices speech by characters with a minimum", () => {
    expect(quoteAudio({ kind: "speech", characters: 0 }).credits).toBe(2);
    expect(quoteAudio({ kind: "speech", characters: 100 }).credits).toBe(5);
  });

  it("parses string search params and rejects odd lengths", () => {
    expect(AudioQuoteRequestSchema.safeParse({ kind: "music", durationSec: "60" }).success).toBe(
      true,
    );
    expect(AudioQuoteRequestSchema.safeParse({ kind: "music", durationSec: "45" }).success).toBe(
      false,
    );
  });
});

describe("titleFrom", () => {
  it("takes the first words, capitalised, without trailing punctuation", () => {
    expect(titleFrom("drums build as Kaito runs fast, then stops.")).toBe(
      "Drums build as Kaito runs",
    );
    expect(titleFrom("   ")).toBe("Untitled");
  });
});

describe("waveform", () => {
  it("is deterministic and in range", () => {
    const a = waveform("au_1", 48);
    expect(a).toEqual(waveform("au_1", 48));
    expect(a).not.toEqual(waveform("au_2", 48));
    expect(a).toHaveLength(48);
    expect(a.every((value) => value >= 0.15 && value <= 1)).toBe(true);
  });

  it("counts played bars", () => {
    expect(playedBars(48, 0.5)).toBe(24);
    expect(playedBars(48, 2)).toBe(48);
    expect(playedBars(48, -1)).toBe(0);
  });
});

describe("advancePosition", () => {
  it("advances and stops at the end", () => {
    expect(advancePosition(1, 0.5, 4)).toEqual({ position: 1.5, ended: false });
    expect(advancePosition(3.9, 0.5, 4)).toEqual({ position: 4, ended: true });
  });
});

describe("describeProgress", () => {
  const base = advanceClip(record(), T0);
  const at = (now: number): AudioClip => advanceClip(record(), now);

  it("announces start, quarter steps and ready, not every poll", () => {
    const start = at(T0 + QUEUED_FOR_MS + 100);
    expect(describeProgress([base], [start])).toEqual(["Drums build started generating."]);
    const small = at(T0 + QUEUED_FOR_MS + 500);
    expect(describeProgress([start], [small])).toEqual([]);
    const quarter = at(T0 + QUEUED_FOR_MS + 3_000);
    expect(describeProgress([small], [quarter])).toEqual(["Drums build is 30% done."]);
    expect(describeProgress([quarter], [at(T0 + 60_000)])).toEqual([
      "Drums build is ready to play.",
    ]);
  });

  it("skips clips it has not seen before", () => {
    expect(describeProgress([], [base])).toEqual([]);
  });
});

describe("improveMusicPrompt", () => {
  const input: MusicMagicPromptRequest = {
    prompt: "an epic song, masterpiece",
    genre: "highlife",
    mood: "calm",
    strength: "standard",
    attempt: 0,
  };

  it("replaces vague words and adds instruments, tempo and shape", () => {
    const result = improveMusicPrompt(input);
    if (result.status !== "improved") throw new Error("Expected a suggestion");
    expect(result.improved).not.toMatch(/epic|masterpiece/i);
    expect(result.improved).toMatch(/guitar/);
    expect(result.improved).toMatch(/bpm/);
    expect(result.changes.length).toBeGreaterThanOrEqual(4);
  });

  it("declines explicit requests", () => {
    expect(improveMusicPrompt({ ...input, prompt: "something sexual" }).status).toBe("declined");
  });
});
