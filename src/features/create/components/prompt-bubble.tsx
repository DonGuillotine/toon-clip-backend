"use client";

import { useQuery } from "@tanstack/react-query";
import { Clapperboard, Coins, Image, Music, Plus, Video, WandSparkles, X } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { OptionMenu, type Option } from "@/components/form/option-menu";
import { SpeechBubble } from "@/components/manga/speech-bubble";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { accountQuery } from "@/features/account/queries";
import { charactersQuery } from "@/features/characters/queries";
import { type AspectRatio } from "@/features/storyboards/schema";
import { formatCredits } from "@/lib/format";

import { quoteQuery } from "../queries";
import {
  CREATE_MODES,
  type CreateMode,
  type StylePreset,
  STYLE_PRESETS,
  type TargetLength,
  TARGET_LENGTHS,
} from "../schema";

const MODE_TABS = {
  storyboard: { label: "Storyboard", icon: Clapperboard },
  image: { label: "Image", icon: Image },
  video: { label: "Video", icon: Video },
  audio: { label: "Audio", icon: Music },
} satisfies Record<CreateMode, { label: string; icon: typeof Clapperboard }>;

const PLACEHOLDER = {
  storyboard: "Describe a scene. Short is fine, Magic Prompt will direct it.",
  image: "Describe a single frame.",
  video: "Describe one shot and how it moves.",
  audio: "Describe a sound, a voice line or a music cue.",
} satisfies Record<CreateMode, string>;

const STYLE_OPTIONS: readonly Option<StylePreset>[] = STYLE_PRESETS.map((style) => ({
  value: style,
  label: style,
}));
const ASPECT_OPTIONS: readonly Option<AspectRatio>[] = [
  { value: "16:9", label: "16:9 landscape" },
  { value: "9:16", label: "9:16 vertical" },
  { value: "1:1", label: "1:1 square" },
];
const LENGTH_OPTIONS: readonly Option<TargetLength>[] = TARGET_LENGTHS.map((seconds) => ({
  value: seconds,
  label: `${String(seconds)} s`,
}));

const IDEAS: readonly string[] = [
  "A masquerade dancer's first festival, drums getting louder",
  "Two rivals share one umbrella at a Lagos bus stop",
  "A chase through Kano's dye pits at dusk",
];

function isCreateMode(value: string): value is CreateMode {
  return CREATE_MODES.some((mode) => mode === value);
}

/**
 * The main way into the product: an idea typed into a speech bubble.
 * The mode lives in the URL (`?make=`); the draft is local until submitted.
 */
export function PromptBubble() {
  const promptId = useId();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useQueryState(
    "make",
    parseAsStringLiteral(CREATE_MODES).withDefault("storyboard"),
  );
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StylePreset>("2D anime");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [lengthSec, setLengthSec] = useState<TargetLength>(30);
  const [cast, setCast] = useState<readonly string[]>(["ch_kaito"]);

  const characters = useQuery(charactersQuery);
  const account = useQuery(accountQuery);
  const quote = useQuery(quoteQuery({ mode, aspectRatio, lengthSec }));

  const attached = (characters.data ?? []).filter((character) => cast.includes(character.id));
  const cost = quote.data?.credits ?? null;
  const balance = account.data?.credits ?? null;
  const short = cost !== null && balance !== null && cost > balance;
  const empty = prompt.trim().length === 0;
  const timed = mode === "storyboard" || mode === "video" || mode === "audio";

  const generate = () => {
    if (empty || short) return;
    toast("Generation is not connected yet. Your idea is still here.");
  };

  return (
    <div className="flex flex-col gap-10">
      <SpeechBubble className="flex flex-col gap-4 p-5 sm:p-6">
        <Tabs
          value={mode}
          onValueChange={(next) => {
            if (isCreateMode(next)) void setMode(next);
          }}
        >
          <TabsList aria-label="What to make" className="-m-1 flex-wrap">
            {CREATE_MODES.map((value) => {
              const tab = MODE_TABS[value];
              const Icon = tab.icon;
              return (
                <TabsTrigger key={value} value={value}>
                  <Icon aria-hidden="true" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <label htmlFor={promptId} className="sr-only">
          Your idea
        </label>
        <Textarea
          id={promptId}
          ref={promptRef}
          variant="bare"
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              generate();
            }
          }}
          placeholder={PLACEHOLDER[mode]}
          rows={3}
          className="min-h-24 font-letter text-xl leading-snug sm:text-2xl"
        />

        <div className="flex flex-wrap items-center gap-2">
          {attached.map((character) => (
            <Button
              key={character.id}
              variant="outline"
              size="sm"
              className="rounded-full ps-1.5"
              aria-label={`Remove ${character.name}`}
              onClick={() => {
                setCast((current) => current.filter((id) => id !== character.id));
              }}
            >
              <span
                aria-hidden="true"
                className="size-5 rounded-full border-2 border-ink"
                style={{ backgroundColor: character.palette[0] }}
              />
              {character.name}
              <X aria-hidden="true" />
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full border-dashed border-ink">
                <Plus aria-hidden="true" /> Character
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48">
              <DropdownMenuLabel>Cast in this idea</DropdownMenuLabel>
              {(characters.data ?? []).map((character) => (
                <DropdownMenuCheckboxItem
                  key={character.id}
                  checked={cast.includes(character.id)}
                  onSelect={(event) => {
                    event.preventDefault();
                  }}
                  onCheckedChange={(checked) => {
                    setCast((current) =>
                      checked
                        ? [...current, character.id]
                        : current.filter((id) => id !== character.id),
                    );
                  }}
                >
                  {character.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span aria-hidden="true" className="mx-1 hidden h-6 border-s-2 border-tone-2 sm:block" />

          <OptionMenu label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} />
          <OptionMenu
            label="Aspect ratio"
            value={aspectRatio}
            options={ASPECT_OPTIONS}
            onChange={setAspectRatio}
          />
          {timed ? (
            <OptionMenu
              label="Length"
              value={lengthSec}
              options={LENGTH_OPTIONS}
              onChange={setLengthSec}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t-2 border-dashed border-tone-3 pt-4">
          <Button
            variant="ink"
            disabled={empty}
            onClick={() => {
              toast("Magic Prompt is not connected yet.");
            }}
          >
            <WandSparkles aria-hidden="true" /> Magic Prompt
          </Button>

          <div className="ms-auto flex flex-wrap items-center justify-end gap-3">
            <p className="flex items-center gap-1.5 text-sm" aria-live="polite">
              <Coins className="size-4" aria-hidden="true" />
              {cost === null ? (
                <span className="text-ink-soft">Pricing…</span>
              ) : (
                <span>
                  <span className="font-bold tabular">{formatCredits(cost)}</span>{" "}
                  <span className="text-ink-soft">credits</span>
                </span>
              )}
            </p>
            {short ? (
              <p className="rounded-full border-2 border-fail px-3 py-1 text-sm font-bold text-fail">
                Insufficient credits
              </p>
            ) : null}
            <Button size="lg" disabled={empty || short} onClick={generate}>
              Generate
              <Kbd className="hidden border-ink/40 sm:inline-flex">⌘↵</Kbd>
            </Button>
          </div>
        </div>
      </SpeechBubble>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-ink-soft">Or start from one of these</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-6">
          {IDEAS.map((idea, index) => (
            <li key={idea}>
              <SpeechBubble size="sm" tail={index % 2 === 0 ? "bottom-start" : "bottom-end"}>
                <Button
                  variant="ghost"
                  className="h-auto rounded-3xl px-4 py-2 font-letter text-base font-normal whitespace-normal text-start"
                  onClick={() => {
                    setPrompt(idea);
                    promptRef.current?.focus();
                  }}
                >
                  {idea}
                </Button>
              </SpeechBubble>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
