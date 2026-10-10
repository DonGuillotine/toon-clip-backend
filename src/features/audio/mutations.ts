"use client";

import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { request } from "@/lib/api/client";
import { keys } from "@/lib/query/keys";

import { audioLibraryQuery } from "./queries";
import {
  type AudioClip,
  AudioClipSchema,
  type AudioLibrary,
  type AudioRequest,
  type CreateVoiceRequest,
  DeletedSchema,
  type UpdateVoiceRequest,
  type Voice,
  VoiceSchema,
} from "./schema";

type Context = { readonly previous: AudioLibrary | undefined };

const { queryKey } = audioLibraryQuery;

/** Cancel in-flight polls, snapshot the library and apply an optimistic edit. */
async function optimistic(
  queryClient: QueryClient,
  edit: (library: AudioLibrary) => AudioLibrary,
): Promise<Context> {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  if (previous) queryClient.setQueryData(queryKey, edit(previous));
  return { previous };
}

function rollback(queryClient: QueryClient, context: Context | undefined): void {
  if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
}

const clipPath = (id: string): string => `/api/audio/clips/${encodeURIComponent(id)}`;
const voicePath = (id: string): string => `/api/audio/voices/${encodeURIComponent(id)}`;

/** Start a music or speech generation. It shows as queued at once and rolls back on error. */
export function useGenerateAudio() {
  const queryClient = useQueryClient();

  return useMutation<AudioClip, Error, AudioRequest, Context>({
    mutationFn: (body) => request("/api/audio/clips", AudioClipSchema, { method: "POST", body }),
    onMutate: (body) =>
      optimistic(queryClient, (library) => {
        const text = body.kind === "music" ? body.prompt : body.text;
        const pending: AudioClip = {
          id: `pending_${String(Date.now())}`,
          kind: body.kind,
          title: text.trim().split(/\s+/).slice(0, 5).join(" ") || "Untitled",
          text,
          summary: body.kind === "music" ? "Music" : "Speech",
          durationSec: body.kind === "music" ? body.durationSec : 1,
          voiceId: body.kind === "speech" ? body.voiceId : null,
          credits: 0,
          createdAt: new Date().toISOString(),
          status: "queued",
        };
        return { ...library, clips: [pending, ...library.clips] };
      }),
    onSuccess: (clip) => {
      toast(`${clip.title} is queued. It lands in your library when it is ready.`);
    },
    onError: (_error, _body, context) => {
      rollback(queryClient, context);
      toast.error("That did not start, and no credits were spent. Try again.");
    },
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: keys.account.me() }),
      ]),
  });
}

/** Retry a failed clip. It flips to queued at once and rolls back on error. */
export function useRetryClip() {
  const queryClient = useQueryClient();

  return useMutation<AudioClip, Error, string, Context>({
    mutationFn: (id) => request(`${clipPath(id)}/retry`, AudioClipSchema, { method: "POST" }),
    onMutate: (id) =>
      optimistic(queryClient, (library) => ({
        ...library,
        clips: library.clips.map((clip): AudioClip => {
          if (clip.id !== id) return clip;
          const { id: clipId, kind, title, text, summary, durationSec, voiceId, credits } = clip;
          return {
            id: clipId,
            kind,
            title,
            text,
            summary,
            durationSec,
            voiceId,
            credits,
            createdAt: clip.createdAt,
            status: "queued",
          };
        }),
      })),
    onError: (_error, _id, context) => {
      rollback(queryClient, context);
      toast.error("The retry did not start. Try again.");
    },
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: keys.account.me() }),
      ]),
  });
}

export function useRenameClip() {
  const queryClient = useQueryClient();

  return useMutation<AudioClip, Error, { readonly id: string; readonly title: string }, Context>({
    mutationFn: ({ id, title }) =>
      request(clipPath(id), AudioClipSchema, { method: "PATCH", body: { title } }),
    onMutate: ({ id, title }) =>
      optimistic(queryClient, (library) => ({
        ...library,
        clips: library.clips.map((clip) => (clip.id === id ? { ...clip, title } : clip)),
      })),
    onError: (_error, _input, context) => {
      rollback(queryClient, context);
      toast.error("The name did not save. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteClip() {
  const queryClient = useQueryClient();

  return useMutation<{ readonly id: string }, Error, AudioClip, Context>({
    mutationFn: (clip) => request(clipPath(clip.id), DeletedSchema, { method: "DELETE" }),
    onMutate: (target) =>
      optimistic(queryClient, (library) => ({
        ...library,
        clips: library.clips.filter((clip) => clip.id !== target.id),
      })),
    onSuccess: (_result, clip) => {
      toast(`${clip.title} was deleted.`);
    },
    onError: (_error, _clip, context) => {
      rollback(queryClient, context);
      toast.error("That clip was not deleted. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useCreateVoice() {
  const queryClient = useQueryClient();

  return useMutation<Voice, Error, CreateVoiceRequest>({
    mutationFn: (body) => request("/api/audio/voices", VoiceSchema, { method: "POST", body }),
    onSuccess: (voice) => {
      toast(`${voice.name} is in your voice library.`);
    },
    onError: () => {
      toast.error("The voice was not created. Check the details and try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Rename a voice or link it to a character sheet. One character has one voice. */
export function useUpdateVoice() {
  const queryClient = useQueryClient();

  return useMutation<
    Voice,
    Error,
    { readonly id: string; readonly changes: UpdateVoiceRequest },
    Context
  >({
    mutationFn: ({ id, changes }) =>
      request(voicePath(id), VoiceSchema, { method: "PATCH", body: changes }),
    onMutate: ({ id, changes }) =>
      optimistic(queryClient, (library) => ({
        ...library,
        voices: library.voices.map((voice) => {
          if (voice.id === id) {
            return {
              ...voice,
              name: changes.name ?? voice.name,
              characterId:
                changes.characterId === undefined ? voice.characterId : changes.characterId,
            };
          }
          // Linking a character here unlinks it from any other voice.
          if (
            changes.characterId !== undefined &&
            changes.characterId !== null &&
            voice.characterId === changes.characterId
          ) {
            return { ...voice, characterId: null };
          }
          return voice;
        }),
      })),
    onError: (_error, _input, context) => {
      rollback(queryClient, context);
      toast.error("That change did not save. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteVoice() {
  const queryClient = useQueryClient();

  return useMutation<{ readonly id: string }, Error, Voice, Context>({
    mutationFn: (voice) => request(voicePath(voice.id), DeletedSchema, { method: "DELETE" }),
    onMutate: (target) =>
      optimistic(queryClient, (library) => ({
        ...library,
        voices: library.voices.filter((voice) => voice.id !== target.id),
      })),
    onSuccess: (_result, voice) => {
      toast(`${voice.name} was deleted. Clips it already read are kept.`);
    },
    onError: (_error, _voice, context) => {
      rollback(queryClient, context);
      toast.error("That voice was not deleted. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
