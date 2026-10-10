"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsNumberLiteral, parseAsStringLiteral, useQueryState } from "nuqs";
import { useId, useRef, useState } from "react";

import { Section } from "@/components/section";
import { OptionMenu } from "@/components/form/option-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { accountQuery } from "@/features/account/queries";
import { GenerateBar } from "@/features/create/components/generate-bar";
import { MagicPromptButton } from "@/features/magic-prompt/components/magic-prompt-button";
import { formatDuration } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";

import { useGenerateAudio } from "../mutations";
import { audioQuoteQuery } from "../queries";
import { type Genre, GENRES, type Mood, MOODS, MUSIC_DURATIONS } from "../schema";
import { MusicMagicPrompt } from "./music-magic-prompt";

const GENRE_LABEL = {
  afrobeats: "Afrobeats",
  highlife: "Highlife",
  orchestral: "Orchestral",
  lofi: "Lo-fi",
  electronic: "Electronic",
} satisfies Record<Genre, string>;

const MOOD_LABEL = {
  tense: "Tense",
  triumphant: "Triumphant",
  calm: "Calm",
  playful: "Playful",
  sad: "Sad",
} satisfies Record<Mood, string>;

const MAX_PROMPT = 500;

/**
 * Describe a piece of music, pick a genre, mood and length, see the cost,
 * then generate. Settings live in the URL; the prompt is a local draft until
 * it is sent.
 */
export function MusicComposer() {
  const promptId = useId();
  const generateRef = useRef<HTMLButtonElement>(null);
  const hydrated = useHydrated();
  const [prompt, setPrompt] = useState("");
  const [magicFor, setMagicFor] = useState<string | null>(null);
  const [genre, setGenre] = useQueryState(
    "genre",
    parseAsStringLiteral(GENRES).withDefault("afrobeats"),
  );
  const [mood, setMood] = useQueryState("mood", parseAsStringLiteral(MOODS).withDefault("tense"));
  const [durationSec, setDurationSec] = useQueryState(
    "length",
    parseAsNumberLiteral(MUSIC_DURATIONS).withDefault(30),
  );

  const quote = useQuery(audioQuoteQuery({ kind: "music", durationSec }));
  const account = useQuery(accountQuery);
  const generate = useGenerateAudio();
  const empty = prompt.trim() === "";

  return (
    <Section
      title="Make music"
      titleId="music-composer"
      description="Score a scene: describe what happens, the genre and the mood do the rest."
      well={false}
    >
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={promptId}>Describe the music</Label>
          <Textarea
            id={promptId}
            value={prompt}
            maxLength={MAX_PROMPT}
            placeholder="For example: drums build as Kaito runs across the rooftops"
            onChange={(event) => {
              setPrompt(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !empty) {
                event.preventDefault();
                // Through the bar, so a large spend still asks first.
                generateRef.current?.click();
              }
            }}
          />
          <p className="tabular text-end text-xs text-muted-foreground">
            {prompt.length} / {MAX_PROMPT}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <OptionMenu
            label="Genre"
            value={genre}
            options={GENRES.map((value) => ({ value, label: GENRE_LABEL[value] }))}
            onChange={(value) => void setGenre(value)}
          />
          <OptionMenu
            label="Mood"
            value={mood}
            options={MOODS.map((value) => ({ value, label: MOOD_LABEL[value] }))}
            onChange={(value) => void setMood(value)}
          />
          <OptionMenu
            label="Length"
            value={durationSec}
            options={MUSIC_DURATIONS.map((value) => ({ value, label: formatDuration(value) }))}
            onChange={(value) => void setDurationSec(value)}
          />
          <div className="ms-auto">
            <MagicPromptButton
              disabled={empty}
              pressed={magicFor !== null}
              onClick={() => {
                setMagicFor(magicFor === null ? prompt : null);
              }}
            />
          </div>
        </div>

        {magicFor === null ? null : (
          <MusicMagicPrompt
            original={magicFor}
            genre={genre}
            mood={mood}
            onUse={setPrompt}
            onClose={() => {
              setMagicFor(null);
            }}
          />
        )}

        {quote.isError ? (
          <p className="px-1 text-sm text-destructive-foreground">
            The cost did not load, so Generate is off. Change a setting to try again.
          </p>
        ) : null}

        <GenerateBar
          cost={quote.data?.credits ?? null}
          requiresConfirmation={quote.data?.requiresConfirmation ?? false}
          balance={hydrated ? (account.data?.credits ?? null) : null}
          blocked={empty}
          pending={generate.isPending}
          triggerRef={generateRef}
          onGenerate={() => {
            generate.mutate(
              { kind: "music", prompt, genre, mood, durationSec },
              {
                onSuccess: () => {
                  setPrompt("");
                  setMagicFor(null);
                },
              },
            );
          }}
        />
      </div>
    </Section>
  );
}
