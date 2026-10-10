"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useId, useRef, useState } from "react";

import { Section } from "@/components/section";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accountQuery } from "@/features/account/queries";
import { type CharacterSummary } from "@/features/characters/schema";
import { GenerateBar } from "@/features/create/components/generate-bar";
import { useHydrated } from "@/lib/use-hydrated";

import { useGenerateAudio } from "../mutations";
import { audioQuoteQuery } from "../queries";
import { MAX_SPEECH_CHARACTERS, type Voice } from "../schema";

/**
 * Text to speech: pick a voice (kept in the URL), write the line, see the
 * cost, then generate. The line is a local draft until it is sent.
 */
export function SpeechComposer({
  voices,
  characters,
}: {
  readonly voices: readonly Voice[];
  readonly characters: readonly CharacterSummary[] | null;
}) {
  const textId = useId();
  const voiceId = useId();
  const hydrated = useHydrated();
  const generateRef = useRef<HTMLButtonElement>(null);
  const [text, setText] = useState("");
  const [picked, setPicked] = useQueryState("voice", parseAsString);
  // A voice in the URL that no longer exists falls back to the first one.
  const voice = voices.find((item) => item.id === picked) ?? voices[0] ?? null;

  const lineLength = text.trim().length;
  const quote = useQuery(audioQuoteQuery({ kind: "speech", characters: lineLength }));
  const account = useQuery(accountQuery);
  const generate = useGenerateAudio();
  const empty = lineLength === 0;
  const speaker = characters?.find((item) => item.id === voice?.characterId) ?? null;

  return (
    <Section
      title="Voice a line"
      titleId="speech-composer"
      description="Write what they say. Punctuation sets the pace."
      well={false}
    >
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={voiceId}>Voice</Label>
          {voice === null ? (
            <p className="text-sm text-muted-foreground">
              No voices yet. Make one in the voice library first.
            </p>
          ) : (
            <Select
              value={voice.id}
              onValueChange={(next) => {
                void setPicked(next);
              }}
            >
              <SelectTrigger id={voiceId} className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voices.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {speaker === null ? null : (
            <p className="text-xs text-muted-foreground">
              The voice of {speaker.name} on their character sheet.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={textId}>Line</Label>
          <Textarea
            id={textId}
            value={text}
            maxLength={MAX_SPEECH_CHARACTERS}
            placeholder="You will not pass me. Not today, not in my city."
            onChange={(event) => {
              setText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                generateRef.current?.click();
              }
            }}
          />
          <p className="tabular text-end text-xs text-muted-foreground">
            {text.length} / {MAX_SPEECH_CHARACTERS}
          </p>
        </div>

        {quote.isError ? (
          <p className="px-1 text-sm text-destructive-foreground">
            The cost did not load, so Generate is off. Edit the line to try again.
          </p>
        ) : null}

        <GenerateBar
          cost={quote.data?.credits ?? null}
          requiresConfirmation={quote.data?.requiresConfirmation ?? false}
          balance={hydrated ? (account.data?.credits ?? null) : null}
          blocked={empty || voice === null}
          pending={generate.isPending}
          triggerRef={generateRef}
          onGenerate={() => {
            if (voice === null) return;
            generate.mutate(
              { kind: "speech", voiceId: voice.id, text },
              {
                onSuccess: () => {
                  setText("");
                },
              },
            );
          }}
        />
      </div>
    </Section>
  );
}
