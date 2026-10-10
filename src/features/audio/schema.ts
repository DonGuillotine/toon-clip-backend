import { z } from "zod";

import { MagicPromptResultSchema, StrengthSchema } from "@/features/magic-prompt/schema";

/** The two halves of Music and voices, kept in the URL as `tab`. */
export const AudioTabSchema = z.enum(["music", "voices"]);
export const AUDIO_TABS = AudioTabSchema.options;
export type AudioTab = z.infer<typeof AudioTabSchema>;

export const GenreSchema = z.enum(["afrobeats", "highlife", "orchestral", "lofi", "electronic"]);
export const GENRES = GenreSchema.options;
export type Genre = z.infer<typeof GenreSchema>;

export const MoodSchema = z.enum(["tense", "triumphant", "calm", "playful", "sad"]);
export const MOODS = MoodSchema.options;
export type Mood = z.infer<typeof MoodSchema>;

/** Music lengths the fixture service offers, in seconds. */
export const MusicDurationSchema = z.union([
  z.literal(15),
  z.literal(30),
  z.literal(60),
  z.literal(120),
  z.literal(180),
]);
export const MUSIC_DURATIONS: readonly MusicDuration[] = [15, 30, 60, 120, 180];
export type MusicDuration = z.infer<typeof MusicDurationSchema>;

/** Longest line a voice reads in one generation. */
export const MAX_SPEECH_CHARACTERS = 600;

// CONTRACT: unconfirmed. What the client sends to make a piece of music.
export const MusicRequestSchema = z.object({
  kind: z.literal("music"),
  prompt: z.string().trim().min(1).max(500),
  genre: GenreSchema,
  mood: MoodSchema,
  durationSec: MusicDurationSchema,
});
export type MusicRequest = z.infer<typeof MusicRequestSchema>;

// CONTRACT: unconfirmed. What the client sends to have a voice read a line.
export const SpeechRequestSchema = z.object({
  kind: z.literal("speech"),
  voiceId: z.string(),
  text: z.string().trim().min(1).max(MAX_SPEECH_CHARACTERS),
});
export type SpeechRequest = z.infer<typeof SpeechRequestSchema>;

export const AudioRequestSchema = z.discriminatedUnion("kind", [
  MusicRequestSchema,
  SpeechRequestSchema,
]);
export type AudioRequest = z.infer<typeof AudioRequestSchema>;

export const AudioKindSchema = z.enum(["music", "speech"]);
export type AudioKind = z.infer<typeof AudioKindSchema>;

/** The library filter, kept in the URL as `kind`. */
export const LibraryFilterSchema = z.enum(["all", "music", "speech"]);
export const LIBRARY_FILTERS = LibraryFilterSchema.options;
export type LibraryFilter = z.infer<typeof LibraryFilterSchema>;

const ClipBase = z.object({
  id: z.string(),
  kind: AudioKindSchema,
  title: z.string().min(1),
  /** The prompt for music, the line for speech. */
  text: z.string(),
  /** One line on how it was made, written by the API. */
  summary: z.string(),
  durationSec: z.number().positive(),
  voiceId: z.string().nullable(),
  credits: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});

// CONTRACT: unconfirmed. A generated clip, discriminated on `status`.
export const AudioClipSchema = z.discriminatedUnion("status", [
  ClipBase.extend({ status: z.literal("queued") }),
  ClipBase.extend({ status: z.literal("generating"), progress: z.number().min(0).max(100) }),
  ClipBase.extend({ status: z.literal("ready") }),
  ClipBase.extend({
    status: z.literal("failed"),
    reason: z.string().min(1),
    /** Failed generations are refunded; the API says how much went back. */
    refunded: z.number().int().nonnegative(),
  }),
]);
export type AudioClip = z.infer<typeof AudioClipSchema>;
export type AudioClipStatus = AudioClip["status"];

export const VoiceSourceSchema = z.enum(["sample", "described", "uploaded"]);
export type VoiceSource = z.infer<typeof VoiceSourceSchema>;

// CONTRACT: unconfirmed. A voice in the library.
export const VoiceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  source: VoiceSourceSchema,
  /** Sample voices ship with Toon Clip and cannot be deleted. */
  isSample: z.boolean(),
  /** The character sheet this voice belongs to, if any. */
  characterId: z.string().nullable(),
  /** The uploaded reference, when the voice was cloned from one. */
  sampleFileName: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type Voice = z.infer<typeof VoiceSchema>;

// CONTRACT: unconfirmed. GET /api/audio
export const AudioLibrarySchema = z.object({
  clips: z.array(AudioClipSchema),
  voices: z.array(VoiceSchema),
});
export type AudioLibrary = z.infer<typeof AudioLibrarySchema>;

// CONTRACT: unconfirmed. GET /api/audio/quote. Search params arrive as strings.
export const AudioQuoteRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("music"), durationSec: z.coerce.number().pipe(MusicDurationSchema) }),
  z.object({
    kind: z.literal("speech"),
    characters: z.coerce.number().int().min(0).max(MAX_SPEECH_CHARACTERS),
  }),
]);
export type AudioQuoteRequest = z.infer<typeof AudioQuoteRequestSchema>;

// CONTRACT: unconfirmed. The API prices audio; the client only shows it.
export const AudioQuoteSchema = z.object({
  credits: z.number().int().nonnegative(),
  requiresConfirmation: z.boolean(),
});
export type AudioQuote = z.infer<typeof AudioQuoteSchema>;

// CONTRACT: unconfirmed. POST /api/audio/voices
export const CreateVoiceRequestSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("described"),
    name: z.string().trim().min(1).max(40),
    description: z.string().trim().min(8).max(300),
  }),
  z.object({
    source: z.literal("uploaded"),
    name: z.string().trim().min(1).max(40),
    description: z.string().trim().max(300),
    sampleFileName: z.string().min(1),
    /** Users confirm they have the right to use an uploaded voice (spec 12). */
    rightsConfirmed: z.literal(true),
  }),
]);
export type CreateVoiceRequest = z.infer<typeof CreateVoiceRequestSchema>;

// CONTRACT: unconfirmed. PATCH /api/audio/voices/:id
export const UpdateVoiceRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    characterId: z.string().nullable(),
  })
  .partial();
export type UpdateVoiceRequest = z.infer<typeof UpdateVoiceRequestSchema>;

// CONTRACT: unconfirmed. PATCH /api/audio/clips/:id
export const RenameClipRequestSchema = z.object({
  title: z.string().trim().min(1).max(60),
});
export type RenameClipRequest = z.infer<typeof RenameClipRequestSchema>;

/** What a delete returns: the id that is gone. */
export const DeletedSchema = z.object({ id: z.string() });

// CONTRACT: unconfirmed. POST /api/audio/magic-prompt. Music has its own recipes.
export const MusicMagicPromptRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  genre: GenreSchema,
  mood: MoodSchema,
  strength: StrengthSchema,
  attempt: z.number().int().nonnegative(),
});
export type MusicMagicPromptRequest = z.infer<typeof MusicMagicPromptRequestSchema>;

export const MusicMagicPromptResultSchema = MagicPromptResultSchema;
