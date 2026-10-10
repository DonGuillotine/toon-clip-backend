import { refundCredits, spendCredits } from "@/features/account/server";
import {
  advanceClip,
  type ClipRecord,
  FAIL_EVERY,
  newClipRecord,
  seedClips,
  seedVoices,
} from "@/features/audio/mocks";
import {
  type AudioClip,
  type AudioLibrary,
  AudioLibrarySchema,
  type AudioRequest,
  type CreateVoiceRequest,
  type UpdateVoiceRequest,
  type Voice,
  VoiceSchema,
} from "@/features/audio/schema";
import { charactersFixture } from "@/features/characters/mocks";

/**
 * The in-memory stand-in for the audio API. Only route handlers import this
 * file; when the backend lands, the handlers proxy to it and this file is
 * deleted. State lives on `globalThis` so every route bundle shares it.
 */

type Store = {
  readonly clips: Map<string, ClipRecord>;
  readonly voices: Map<string, Voice>;
  counter: number;
  readonly bootedAt: number;
  /** Clip ids whose failure has already been refunded. */
  readonly refunded: Set<string>;
  /** Generations made since start, so every Nth one fails once. */
  generations: number;
};

const scope: typeof globalThis & { toonClipAudioStore?: Store } = globalThis;

function createStore(): Store {
  const now = Date.now();
  return {
    clips: new Map(seedClips(now).map((record) => [record.id, record])),
    voices: new Map(seedVoices(now).map((voice) => [voice.id, voice])),
    refunded: new Set(),
    bootedAt: now,
    counter: 0,
    generations: 0,
  };
}

/** Advance a clip and refund its credits the first time it is seen failed. */
function advance(record: ClipRecord, now: number): AudioClip {
  const clip = advanceClip(record, now);
  const s = store();
  if (clip.status === "failed" && !s.refunded.has(record.id) && record.startedAt > s.bootedAt) {
    s.refunded.add(record.id);
    refundCredits(record.credits, `Refund: ${clip.title} failed`);
  }
  return clip;
}

function store(): Store {
  scope.toonClipAudioStore ??= createStore();
  return scope.toonClipAudioStore;
}

function newId(prefix: string): string {
  const s = store();
  s.counter += 1;
  return `${prefix}_${Date.now().toString(36)}${String(s.counter)}`;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly status: 402 | 404 | 409 | 422; readonly message: string };

const missing = (what: string): Result<never> => ({
  ok: false,
  status: 404,
  message: `That ${what} does not exist.`,
});

export function getLibrary(now = Date.now()): AudioLibrary {
  const s = store();
  const clips = [...s.clips.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((record) => advance(record, now));
  const voices = [...s.voices.values()].sort((a, b) => {
    if (a.isSample !== b.isSample) return a.isSample ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
  return AudioLibrarySchema.parse({ clips, voices });
}

export function generateClip(request: AudioRequest): Result<AudioClip> {
  const s = store();
  let voice: Voice | null = null;
  if (request.kind === "speech") {
    voice = s.voices.get(request.voiceId) ?? null;
    if (voice === null) {
      return { ok: false, status: 422, message: "That voice is gone. Pick another one." };
    }
  }
  const now = Date.now();
  const record = newClipRecord(request, voice, {
    id: newId("au"),
    now,
    fails: (s.generations + 1) % FAIL_EVERY === 0,
  });
  const spent = spendCredits(record.credits, `Audio: ${record.title}`);
  if (!spent.ok) return { ok: false, status: 402, message: spent.message };
  s.generations += 1;
  s.clips.set(record.id, record);
  return { ok: true, value: advanceClip(record, now) };
}

export function retryClip(id: string): Result<AudioClip> {
  const s = store();
  const record = s.clips.get(id);
  if (!record) return missing("clip");
  const now = Date.now();
  if (advanceClip(record, now).status !== "failed") {
    return { ok: false, status: 409, message: "Only a failed clip can be retried." };
  }
  const spent = spendCredits(record.credits, `Audio retry: ${record.title}`);
  if (!spent.ok) return { ok: false, status: 402, message: spent.message };
  s.refunded.delete(id);
  const retried: ClipRecord = { ...record, startedAt: now, failWith: null };
  s.clips.set(id, retried);
  return { ok: true, value: advanceClip(retried, now) };
}

export function renameClip(id: string, title: string): Result<AudioClip> {
  const s = store();
  const record = s.clips.get(id);
  if (!record) return missing("clip");
  const renamed: ClipRecord = { ...record, title: title.trim() };
  s.clips.set(id, renamed);
  return { ok: true, value: advanceClip(renamed, Date.now()) };
}

export function deleteClip(id: string): Result<{ readonly id: string }> {
  return store().clips.delete(id) ? { ok: true, value: { id } } : missing("clip");
}

export function createVoice(request: CreateVoiceRequest): Result<Voice> {
  const voice = VoiceSchema.parse({
    id: newId("vo"),
    name: request.name.trim(),
    description:
      request.description.trim() === ""
        ? "Cloned from an uploaded sample."
        : request.description.trim(),
    source: request.source,
    isSample: false,
    characterId: null,
    sampleFileName: request.source === "uploaded" ? request.sampleFileName : null,
    createdAt: new Date().toISOString(),
  });
  store().voices.set(voice.id, voice);
  return { ok: true, value: voice };
}

export function updateVoice(id: string, request: UpdateVoiceRequest): Result<Voice> {
  const s = store();
  const voice = s.voices.get(id);
  if (!voice) return missing("voice");
  if (request.name !== undefined && voice.isSample) {
    return { ok: false, status: 409, message: "Sample voices keep their names." };
  }
  const characterId = request.characterId;
  if (
    characterId !== undefined &&
    characterId !== null &&
    !charactersFixture.some((character) => character.id === characterId)
  ) {
    return { ok: false, status: 422, message: "That character sheet does not exist." };
  }
  // A character has one voice: linking here unlinks it elsewhere.
  if (characterId !== undefined && characterId !== null) {
    for (const other of s.voices.values()) {
      if (other.id !== id && other.characterId === characterId) {
        s.voices.set(other.id, { ...other, characterId: null });
      }
    }
  }
  const updated = VoiceSchema.parse({
    ...voice,
    name: request.name?.trim() ?? voice.name,
    characterId: characterId === undefined ? voice.characterId : characterId,
  });
  s.voices.set(id, updated);
  return { ok: true, value: updated };
}

export function deleteVoice(id: string): Result<{ readonly id: string }> {
  const s = store();
  const voice = s.voices.get(id);
  if (!voice) return missing("voice");
  if (voice.isSample) {
    return { ok: false, status: 409, message: "Sample voices cannot be deleted." };
  }
  s.voices.delete(id);
  return { ok: true, value: { id } };
}
