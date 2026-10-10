import { CONFIRM_ABOVE_CREDITS } from "@/features/storyboards/timeline";

import {
  type AudioClip,
  AudioClipSchema,
  type AudioKind,
  type AudioQuote,
  type AudioQuoteRequest,
  AudioQuoteSchema,
  type AudioRequest,
  type Genre,
  type Mood,
  type Voice,
  VoiceSchema,
} from "./schema";

/**
 * A stand-in audio service. Only the fixture API (`src/app/api/audio/**`) and
 * tests import this file. Jobs move through their states on a clock, so the
 * library has something to poll, and prices live here because only the API
 * knows prices.
 */

/** Simulated timing, in milliseconds. */
export const QUEUED_FOR_MS = 2_000;
const GENERATING_FOR_MS: Record<AudioKind, number> = { music: 10_000, speech: 5_000 };

/** Fixture prices. */
const MUSIC_CREDITS_PER_SECOND = 2;
const SPEECH_CHARACTERS_PER_CREDIT = 20;
const SPEECH_MINIMUM_CREDITS = 2;
/** Roughly how fast a voice reads, for the length of a speech clip. */
const SPEECH_CHARACTERS_PER_SECOND = 15;

/** Every Nth generation fails on its first attempt, so the failed state is reachable. */
export const FAIL_EVERY = 4;

export type ClipRecord = {
  readonly id: string;
  readonly kind: AudioKind;
  readonly title: string;
  readonly text: string;
  readonly summary: string;
  readonly durationSec: number;
  readonly voiceId: string | null;
  readonly credits: number;
  readonly createdAt: number;
  /** When the current attempt started, in ms. A retry resets it. */
  readonly startedAt: number;
  /** Set when this attempt is going to fail, with the reason the API gives. */
  readonly failWith: string | null;
};

/** Where a clip is at `now`. Pure, so the state machine is testable. */
export function advanceClip(record: ClipRecord, now: number): AudioClip {
  const base = {
    id: record.id,
    kind: record.kind,
    title: record.title,
    text: record.text,
    summary: record.summary,
    durationSec: record.durationSec,
    voiceId: record.voiceId,
    credits: record.credits,
    createdAt: new Date(record.createdAt).toISOString(),
  };
  const elapsed = now - record.startedAt;
  const generatingFor = GENERATING_FOR_MS[record.kind];
  if (elapsed < QUEUED_FOR_MS) return AudioClipSchema.parse({ ...base, status: "queued" });
  if (elapsed < QUEUED_FOR_MS + generatingFor) {
    const progress = Math.round(((elapsed - QUEUED_FOR_MS) / generatingFor) * 100);
    return AudioClipSchema.parse({ ...base, status: "generating", progress });
  }
  if (record.failWith !== null) {
    return AudioClipSchema.parse({
      ...base,
      status: "failed",
      reason: record.failWith,
      refunded: record.credits,
    });
  }
  return AudioClipSchema.parse({ ...base, status: "ready" });
}

/** Seconds a voice takes to read a line. */
export function speechSeconds(text: string): number {
  return Math.max(1, Math.round(text.trim().length / SPEECH_CHARACTERS_PER_SECOND));
}

export function quoteAudio(input: AudioQuoteRequest): AudioQuote {
  const credits =
    input.kind === "music"
      ? input.durationSec * MUSIC_CREDITS_PER_SECOND
      : Math.max(
          SPEECH_MINIMUM_CREDITS,
          Math.ceil(input.characters / SPEECH_CHARACTERS_PER_CREDIT),
        );
  return AudioQuoteSchema.parse({ credits, requiresConfirmation: credits > CONFIRM_ABOVE_CREDITS });
}

export const GENRE_LABEL = {
  afrobeats: "Afrobeats",
  highlife: "Highlife",
  orchestral: "Orchestral",
  lofi: "Lo-fi",
  electronic: "Electronic",
} satisfies Record<Genre, string>;

export const MOOD_LABEL = {
  tense: "Tense",
  triumphant: "Triumphant",
  calm: "Calm",
  playful: "Playful",
  sad: "Sad",
} satisfies Record<Mood, string>;

/** A short title from the first words of a prompt or line. */
export function titleFrom(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 5).join(" ");
  const clean = words.replace(/[.,;:!?]+$/, "");
  const title = clean.charAt(0).toUpperCase() + clean.slice(1);
  return title === "" ? "Untitled" : title.slice(0, 60);
}

/** The record a new generation starts as. */
export function newClipRecord(
  request: AudioRequest,
  voice: Voice | null,
  options: { readonly id: string; readonly now: number; readonly fails: boolean },
): ClipRecord {
  const durationSec = request.kind === "music" ? request.durationSec : speechSeconds(request.text);
  const quote = quoteAudio(
    request.kind === "music"
      ? { kind: "music", durationSec: request.durationSec }
      : { kind: "speech", characters: request.text.trim().length },
  );
  const summary =
    request.kind === "music"
      ? `${GENRE_LABEL[request.genre]}, ${MOOD_LABEL[request.mood].toLowerCase()}, ${String(request.durationSec)} s`
      : `Read by ${voice?.name ?? "an unknown voice"}`;
  return {
    id: options.id,
    kind: request.kind,
    title: titleFrom(request.kind === "music" ? request.prompt : request.text),
    text: request.kind === "music" ? request.prompt.trim() : request.text.trim(),
    summary,
    durationSec,
    voiceId: request.kind === "speech" ? request.voiceId : null,
    credits: quote.credits,
    createdAt: options.now,
    startedAt: options.now,
    failWith: options.fails
      ? request.kind === "music"
        ? "The music model timed out on this one. Your credits are back; try again."
        : "The voice could not finish this line. Your credits are back; try again."
      : null,
  };
}

const HOUR = 60 * 60 * 1000;

export function seedVoices(now: number): readonly Voice[] {
  return [
    {
      id: "vo_kaito",
      name: "Kaito",
      description: "Young man, clipped and steady, a low rasp when he shouts.",
      source: "sample",
      isSample: true,
      characterId: "ch_kaito",
      sampleFileName: null,
      createdAt: new Date(now - 30 * 24 * HOUR).toISOString(),
    },
    {
      id: "vo_narrator",
      name: "Griot narrator",
      description: "Warm older storyteller, unhurried, a smile in the voice.",
      source: "sample",
      isSample: true,
      characterId: null,
      sampleFileName: null,
      createdAt: new Date(now - 30 * 24 * HOUR).toISOString(),
    },
    {
      id: "vo_adaeze",
      name: "Adaeze",
      description: "Bright, quick Lagos accent, laughs between sentences.",
      source: "described",
      isSample: false,
      characterId: "ch_adaeze",
      sampleFileName: null,
      createdAt: new Date(now - 4 * 24 * HOUR).toISOString(),
    },
  ].map((voice) => VoiceSchema.parse(voice));
}

export function seedClips(now: number): readonly ClipRecord[] {
  return [
    {
      id: "au_courtyard_theme",
      kind: "music",
      title: "Courtyard fight theme",
      text: "Talking drums build under a fast shekere, the fight starts on the drop",
      summary: "Afrobeats, tense, 60 s",
      durationSec: 60,
      voiceId: null,
      credits: 120,
      createdAt: now - 26 * HOUR,
      startedAt: now - 26 * HOUR,
      failWith: null,
    },
    {
      id: "au_market_morning",
      kind: "music",
      title: "Market morning",
      text: "Gentle highlife guitar over market chatter, sunrise in Kano",
      summary: "Highlife, calm, 30 s",
      durationSec: 30,
      voiceId: null,
      credits: 60,
      createdAt: now - 5 * HOUR,
      startedAt: now - 5 * HOUR,
      failWith: "The music model timed out on this one. Your credits are back; try again.",
    },
    {
      id: "au_kaito_line",
      kind: "speech",
      title: "You will not pass me",
      text: "You will not pass me. Not today, not in my city.",
      summary: "Read by Kaito",
      durationSec: 3,
      voiceId: "vo_kaito",
      credits: 3,
      createdAt: now - 2 * HOUR,
      startedAt: now - 2 * HOUR,
      failWith: null,
    },
  ];
}
