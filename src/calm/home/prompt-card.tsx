"use client";

import { useQuery } from "@tanstack/react-query";
import { Clapperboard, Coins, Image, Music, Plus, Video, WandSparkles, X } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { type Option } from "@/components/form/option-menu";
import { Button } from "@/components/ui/calm/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/calm/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/calm/tabs";
import { Textarea } from "@/components/ui/calm/textarea";
import { Kbd } from "@/components/ui/kbd";
import { accountQuery } from "@/features/account/queries";
import { charactersQuery } from "@/features/characters/queries";
import { quoteQuery } from "@/features/create/queries";
import {
  CREATE_MODES,
  type CreateMode,
  type StylePreset,
  STYLE_PRESETS,
  type TargetLength,
  TARGET_LENGTHS,
} from "@/features/create/schema";
import { type AspectRatio } from "@/features/storyboards/schema";
import { formatCredits } from "@/lib/format";

import { MarginNote } from "../comic/margin-note";

import { CalmOptionMenu } from "./option-menu";

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
 * The main way into the product: a plain composer card. The mode lives in
 * the URL (`?make=`); the draft is local until submitted.
 */
export function CalmPromptCard() {
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
    <div className="flex flex-col gap-5">
      <Tabs
        value={mode}
        onValueChange={(next) => {
          if (isCreateMode(next)) void setMode(next);
        }}
      >
        <TabsList
          aria-label="What to make"
          className="grid w-full grid-cols-4 sm:inline-flex sm:w-fit max-sm:[&_svg]:hidden"
        >
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

      <div className="flex flex-col rounded-card border border-line-strong bg-sheet shadow-card transition-[border-color,box-shadow] duration-(--duration-fast) ease-out focus-within:border-ink-mute focus-within:shadow-float">
        <label htmlFor={promptId} className="sr-only">
          Your idea
        </label>
        <Textarea
          id={promptId}
          ref={promptRef}
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
          className="min-h-28 px-4 pt-4 text-lg leading-relaxed"
        />

        <div className="flex flex-wrap items-center gap-1 px-3 pt-2 pb-3">
          {attached.map((character) => (
            <Button
              key={character.id}
              variant="outline"
              size="sm"
              className="rounded-full ps-1 pe-2.5 shadow-none"
              aria-label={`Remove ${character.name}`}
              onClick={() => {
                setCast((current) => current.filter((id) => id !== character.id));
              }}
            >
              <span
                aria-hidden="true"
                className="size-5.5 rounded-full"
                style={{ backgroundColor: character.palette[0] }}
              />
              {character.name}
              <X aria-hidden="true" className="size-3.5 text-ink-mute" />
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2.5">
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

          <span aria-hidden="true" className="mx-1 hidden h-5 border-s border-line sm:block" />

          <CalmOptionMenu label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} />
          <CalmOptionMenu
            label="Aspect ratio"
            value={aspectRatio}
            options={ASPECT_OPTIONS}
            onChange={setAspectRatio}
          />
          {timed ? (
            <CalmOptionMenu
              label="Length"
              value={lengthSec}
              options={LENGTH_OPTIONS}
              onChange={setLengthSec}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-b-card border-t border-line bg-paper px-3 py-3">
          <MagicPromptButton
            disabled={empty}
            onClick={() => {
              toast("Magic Prompt is not connected yet.");
            }}
          />

          <div className="ms-auto flex flex-wrap items-center justify-end gap-3">
            <p className="flex items-center gap-1.5 text-sm" aria-live="polite">
              <Coins className="size-4 text-ink-mute" aria-hidden="true" />
              {cost === null ? (
                <span className="text-ink-soft">Pricing…</span>
              ) : (
                <span>
                  <span className="tabular font-medium">{formatCredits(cost)}</span>{" "}
                  <span className="text-ink-soft">credits</span>
                </span>
              )}
            </p>
            {short ? (
              <p className="rounded-full bg-fail/10 px-2.5 py-1 text-sm font-medium text-fail">
                Insufficient credits
              </p>
            ) : null}
            <Button size="lg" disabled={empty || short} onClick={generate}>
              Generate
              <Kbd className="hidden border-sheet/30 bg-transparent text-sheet/80 sm:inline-flex">
                ⌘↵
              </Kbd>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <MarginNote>Need a spark? Try one</MarginNote>
        <ul className="flex flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <li key={idea}>
              <Button
                variant="outline"
                size="sm"
                className="h-auto min-h-8 rounded-full py-1.5 text-start font-normal whitespace-normal text-ink-soft hover:text-ink"
                onClick={() => {
                  setPrompt(idea);
                  promptRef.current?.focus();
                }}
              >
                {idea}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * The one control that earns a comic flourish: on hover, a small burst of
 * focus lines flares behind the wand, the way a manga panel marks a reveal.
 */
function MagicPromptButton({
  disabled,
  onClick,
}: {
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="group/magic overflow-hidden"
    >
      <span aria-hidden="true" className="relative grid size-4 place-items-center">
        <span className="pointer-events-none absolute size-12 scale-75 focus-lines opacity-0 transition-[opacity,transform] duration-(--duration-base) ease-out [--focus-ink:var(--spot-deep)] group-hover/magic:scale-100 group-hover/magic:opacity-100" />
        <WandSparkles className="relative transition-transform duration-(--duration-base) ease-out group-hover/magic:-rotate-12" />
      </span>
      Magic Prompt
    </Button>
  );
}
