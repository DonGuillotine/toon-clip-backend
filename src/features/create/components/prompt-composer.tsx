"use client";

import { useQuery } from "@tanstack/react-query";
import { Clapperboard, Coins, Image, Music, Plus, Video, WandSparkles, X } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { MarginNote } from "@/components/comic/margin-note";
import { OptionMenu, type Option } from "@/components/form/option-menu";
import { Card } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { accountQuery } from "@/features/account/queries";
import { charactersQuery } from "@/features/characters/queries";
import { quoteQuery } from "../queries";
import {
  CREATE_MODES,
  type CreateMode,
  type StylePreset,
  STYLE_PRESETS,
  type TargetLength,
  TARGET_LENGTHS,
} from "../schema";
import { type AspectRatio } from "@/features/storyboards/schema";
import { formatCredits } from "@/lib/format";

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
export function PromptComposer() {
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
    <div className="flex flex-col gap-4">
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

      {/* Card (L2, r24, p8) with the controls in a recessed well (L1, r16).
          Focus shows as the ring around the whole composer. */}
      <Card className="flex flex-col gap-2 has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-ring">
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
          className="min-h-28 px-3 pt-3 text-lg leading-relaxed"
        />

        <div className="flex flex-wrap items-center gap-1 px-1">
          {attached.map((character) => (
            <Button
              key={character.id}
              variant="secondary"
              size="sm"
              className="ps-1 pe-2.5"
              aria-label={`Remove ${character.name}`}
              onClick={() => {
                setCast((current) => current.filter((id) => id !== character.id));
              }}
            >
              <span
                aria-hidden="true"
                className="size-6 rounded-full"
                style={{ backgroundColor: character.palette[0] }}
              />
              {character.name}
              <X aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
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

          <span aria-hidden="true" className="mx-1 hidden h-4 w-px bg-secondary-hover sm:block" />

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

        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2">
          <MagicPromptButton
            disabled={empty}
            onClick={() => {
              toast("Magic Prompt is not connected yet.");
            }}
          />

          <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
            <p className="flex items-center gap-1.5 px-1.5 text-sm" aria-live="polite">
              <Coins className="size-4 text-muted-foreground" aria-hidden="true" />
              {cost === null ? (
                <span className="text-muted-foreground">Pricing…</span>
              ) : (
                <span>
                  <span className="tabular font-medium">{formatCredits(cost)}</span>{" "}
                  <span className="text-muted-foreground">credits</span>
                </span>
              )}
            </p>
            {short ? <Badge variant="destructive">Insufficient credits</Badge> : null}
            <Button size="lg" disabled={empty || short} onClick={generate}>
              Generate
              <Kbd className="hidden sm:inline-flex">⌘↵</Kbd>
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <MarginNote>Need a spark? Try one</MarginNote>
        <ul className="flex flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <li key={idea} className="max-w-full">
              <Button
                variant="secondary"
                size="sm"
                title={idea}
                className="max-w-full font-normal text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setPrompt(idea);
                  promptRef.current?.focus();
                }}
              >
                <span className="truncate">{idea}</span>
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
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      className="group/magic overflow-hidden bg-card hover:bg-card"
    >
      <span aria-hidden="true" className="relative grid size-4 place-items-center">
        <span className="pointer-events-none absolute size-12 scale-90 focus-lines opacity-0 transition-[opacity,transform] duration-(--duration-menu) ease-out-strong [--focus-ink:var(--spot-hover)] group-hover/magic:scale-100 group-hover/magic:opacity-100" />
        <WandSparkles className="relative transition-transform duration-(--duration-menu) ease-out-strong group-hover/magic:-rotate-12" />
      </span>
      Magic Prompt
    </Button>
  );
}
