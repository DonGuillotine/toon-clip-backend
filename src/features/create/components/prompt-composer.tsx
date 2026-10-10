"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Clapperboard, Image, Music, Plus, Video, X } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { MarginNote } from "@/components/comic/margin-note";
import { OptionMenu, type Option } from "@/components/form/option-menu";
import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { accountQuery } from "@/features/account/queries";
import { charactersQuery } from "@/features/characters/queries";
import { MagicPrompt } from "@/features/magic-prompt/components/magic-prompt";
import { MagicPromptButton } from "@/features/magic-prompt/components/magic-prompt-button";
import { useCreatePlan } from "../mutations";
import { quoteQuery } from "../queries";
import {
  CREATE_MODES,
  type CreateMode,
  type Look,
  LOOKS,
  PLAN_AUDIO,
  type PlanAudio,
  SHOT_STYLES,
  type ShotStyle,
  type StylePreset,
  STYLE_PRESETS,
  type TargetLength,
  TARGET_LENGTHS,
} from "../schema";
import { type AspectRatio } from "@/features/storyboards/schema";
import { useHydrated } from "@/lib/use-hydrated";

import { GenerateBar } from "./generate-bar";

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

const SHOT_STYLE_OPTIONS: readonly Option<ShotStyle>[] = SHOT_STYLES.map((value) => ({
  value,
  label: value,
}));
const LOOK_OPTIONS: readonly Option<Look>[] = LOOKS.map((value) => ({ value, label: value }));
const AUDIO_OPTIONS: readonly Option<PlanAudio>[] = PLAN_AUDIO.map((value) => ({
  value,
  label: value === "None" ? "No audio" : value,
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
  const optionsId = useId();
  const highQualityId = useId();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const generateRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [mode, setMode] = useQueryState(
    "make",
    parseAsStringLiteral(CREATE_MODES).withDefault("storyboard"),
  );
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StylePreset>("2D anime");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [lengthSec, setLengthSec] = useState<TargetLength>(30);
  const [cast, setCast] = useState<readonly string[]>(["ch_kaito"]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [shotStyle, setShotStyle] = useState<ShotStyle>("Cinematic");
  const [look, setLook] = useState<Look>("Golden hour");
  const [audio, setAudio] = useState<PlanAudio>("Music and effects");
  const [highQuality, setHighQuality] = useState(false);
  /** The prompt as it was when Magic Prompt opened; null when closed. */
  const [magicFor, setMagicFor] = useState<string | null>(null);
  const plan = useCreatePlan();

  const characters = useQuery(charactersQuery);
  const account = useQuery(accountQuery);
  const storyboard = mode === "storyboard";
  const quote = useQuery(
    quoteQuery({ mode, aspectRatio, lengthSec, ...(storyboard ? { highQuality } : {}) }),
  );

  // The dock fetches the cast too; wait for hydration so the chips do not
  // appear in a render the server never produced.
  const hydrated = useHydrated();
  const attached = hydrated
    ? (characters.data ?? []).filter((character) => cast.includes(character.id))
    : [];
  const cost = quote.data?.credits ?? null;
  const balance = account.data?.credits ?? null;
  const empty = prompt.trim().length === 0;
  const timed = mode === "storyboard" || mode === "video" || mode === "audio";

  const generate = () => {
    if (empty) return;
    if (!storyboard) {
      toast("Use Quick create for single images, video and audio. Your idea is still here.");
      return;
    }
    plan.mutate(
      {
        idea: prompt,
        style,
        aspectRatio,
        lengthSec,
        shotStyle,
        look,
        audio,
        highQuality,
        characterIds: [...cast],
      },
      {
        onSuccess: ({ storyboardId }) => {
          router.push(`/storyboards/${storyboardId}`);
        },
        onError: () => {
          toast("The storyboard could not be planned. Your idea is still here, try again.");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        className="items-center"
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
              generateRef.current?.click();
            }
          }}
          placeholder={PLACEHOLDER[mode]}
          rows={3}
          className="min-h-24 px-3 pt-3 text-start text-lg leading-relaxed"
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
          {storyboard ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-2.5"
              aria-expanded={optionsOpen}
              aria-controls={optionsId}
              onClick={() => {
                setOptionsOpen((open) => !open);
              }}
            >
              Options
              <ChevronDown
                aria-hidden="true"
                className={optionsOpen ? "size-3.5 rotate-180" : "size-3.5"}
              />
            </Button>
          ) : null}
        </div>

        {storyboard && optionsOpen ? (
          <div
            id={optionsId}
            role="group"
            aria-label="Storyboard options"
            className="flex flex-wrap items-center gap-1 px-1"
          >
            <OptionMenu
              label="Shot style"
              value={shotStyle}
              options={SHOT_STYLE_OPTIONS}
              onChange={setShotStyle}
            />
            <OptionMenu label="Look" value={look} options={LOOK_OPTIONS} onChange={setLook} />
            <OptionMenu label="Audio" value={audio} options={AUDIO_OPTIONS} onChange={setAudio} />
            <div className="flex h-8 items-center gap-2 px-2.5">
              <Switch
                id={highQualityId}
                size="sm"
                checked={highQuality}
                onCheckedChange={setHighQuality}
              />
              <Label htmlFor={highQualityId} className="text-sm font-normal">
                High quality
              </Label>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2">
          <MagicPromptButton
            disabled={empty}
            pressed={magicFor !== null}
            onClick={() => {
              setMagicFor(magicFor === null ? prompt : null);
            }}
          />

          <div className="ms-auto">
            <GenerateBar
              cost={cost}
              requiresConfirmation={quote.data?.requiresConfirmation ?? false}
              balance={balance}
              blocked={empty}
              pending={plan.isPending}
              onGenerate={generate}
              triggerRef={generateRef}
            />
          </div>
        </div>
      </Card>

      {magicFor === null ? null : (
        <MagicPrompt
          original={magicFor}
          characterIds={cast}
          onUse={setPrompt}
          onClose={() => {
            setMagicFor(null);
          }}
        />
      )}

      <div className="flex flex-col items-center gap-2">
        <MarginNote>Need a spark? Try one</MarginNote>
        <ul className="flex flex-wrap justify-center gap-2">
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
