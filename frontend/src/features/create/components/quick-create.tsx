"use client";

import { useQuery } from "@tanstack/react-query";
import { AudioLines, CircleAlert, Film, Image, Layers, Scissors } from "lucide-react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { OptionMenu, type Option } from "@/components/form/option-menu";
import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { accountQuery } from "@/features/account/queries";
import { openTopUp } from "@/features/account/top-up-store";
import { MagicPrompt } from "@/features/magic-prompt/components/magic-prompt";
import { MagicPromptButton } from "@/features/magic-prompt/components/magic-prompt-button";
import { ASPECT_RATIOS, type AspectRatio } from "@/features/storyboards/schema";
import { isInsufficientCredits } from "@/lib/api/client";
import { useHydrated } from "@/lib/use-hydrated";

import { useAttachmentsStore } from "../attachments-store";
import { capabilityIssues, supports } from "../capabilities";
import { useFrameHandoff } from "../frame-handoff";
import { useGenerate } from "../mutations";
import { modelsQuery, quoteQuery } from "../queries";
import {
  completeTag,
  countByKind,
  insertTag,
  nextTag,
  type Reference,
  remaining,
  swapFrames,
  tagMatches,
  tagQueryAt,
  unknownTags,
} from "../references";
import {
  QUICK_TABS,
  type QuickTab,
  type ReferenceKind,
  RESOLUTIONS,
  type Resolution,
  VIDEO_INPUTS,
  type VideoInput,
} from "../schema";
import { type Frame, type FrameSlot, FrameSlots } from "./frame-slots";
import { GenerateBar } from "./generate-bar";
import { ModelPicker } from "./model-picker";
import { ReferenceTiles } from "./reference-tiles";

const TAB_META = {
  image: { label: "Image", icon: Image, placeholder: "Describe a single frame." },
  video: {
    label: "Video",
    icon: Film,
    placeholder: "Describe one shot and how it moves. Type @ tags to use references.",
  },
  audio: {
    label: "Audio",
    icon: AudioLines,
    placeholder: "Describe a sound, a voice line or a music cue.",
  },
  composition: {
    label: "Composition",
    icon: Layers,
    placeholder: "Describe how the images combine into one frame, using their @ tags.",
  },
  stitch: {
    label: "Stitch",
    icon: Scissors,
    placeholder: "Notes on the cuts between clips (optional).",
  },
} satisfies Record<QuickTab, { label: string; icon: typeof Image; placeholder: string }>;

const VIDEO_INPUT_LABEL = { reference: "Reference", frames: "Frames" } satisfies Record<
  VideoInput,
  string
>;

const ASPECT_OPTIONS: readonly Option<AspectRatio>[] = ASPECT_RATIOS.map((value) => ({
  value,
  label: value,
}));
const RESOLUTION_OPTIONS: readonly Option<Resolution>[] = RESOLUTIONS.map((value) => ({
  value,
  label: value,
}));
const DURATIONS: readonly number[] = [4, 5, 8, 10, 12, 30];
const DURATION_OPTIONS: readonly Option<number>[] = DURATIONS.map((value) => ({
  value,
  label: `${String(value)} s`,
}));

function isQuickTab(value: string): value is QuickTab {
  return QUICK_TABS.some((tab) => tab === value);
}
function isVideoInput(value: string): value is VideoInput {
  return VIDEO_INPUTS.some((input) => input === value);
}

/** Which reference kinds a tab takes. */
function kindsFor(tab: QuickTab, input: VideoInput): readonly ReferenceKind[] {
  switch (tab) {
    case "video":
      return input === "reference" ? ["image", "video", "audio"] : [];
    case "image":
    case "composition":
      return ["image"];
    case "audio":
      return ["audio"];
    case "stitch":
      return ["video"];
  }
}

/**
 * Quick create (spec 7.2): one-off images, video, audio, compositions and
 * stitches. Tab, video input, model and output settings live in the URL; the
 * draft prompt and uploads are local until submitted.
 */
export function QuickCreate() {
  const promptId = useId();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const generateRef = useRef<HTMLButtonElement>(null);

  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(QUICK_TABS).withDefault("video"));
  const [videoInput, setVideoInput] = useQueryState(
    "input",
    parseAsStringLiteral(VIDEO_INPUTS).withDefault("reference"),
  );
  const [modelId, setModelId] = useQueryState("model", parseAsString);
  const account = useQuery(accountQuery);
  // The account is cached by the shell; gate on hydration so the first
  // client render matches the server's (AGENTS.md §3).
  const hydrated = useHydrated();
  const [aspectRatio, setAspectRatio] = useQueryState(
    "aspect",
    parseAsStringLiteral(ASPECT_RATIOS).withDefault(
      (hydrated ? account.data?.preferences.defaultAspectRatio : undefined) ?? "16:9",
    ),
  );
  const [resolution, setResolution] = useQueryState(
    "res",
    parseAsStringLiteral(RESOLUTIONS).withDefault("720p"),
  );
  const [duration, setDuration] = useQueryState("dur", parseAsInteger.withDefault(5));

  const [prompt, setPrompt] = useState(() => useFrameHandoff.getState().pending.prompt ?? "");
  const [references, setReferences] = useState<readonly Reference[]>([]);
  const [frames, setFrames] = useState<{
    readonly first: Frame | null;
    readonly last: Frame | null;
  }>(() => {
    // Frames handed over from the board or a timeline shot start in the slots.
    // Read without clearing, so a double render in development sees them too.
    const { first, last } = useFrameHandoff.getState().pending;
    return { first, last };
  });
  const [magicFor, setMagicFor] = useState<string | null>(null);
  const [caret, setCaret] = useState(0);
  const [highlight, setHighlight] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const suggestionsId = useId();

  // Once the slots hold the handed-over frames, the handoff empties.
  useEffect(() => {
    useFrameHandoff.getState().clear();
  }, []);

  // Uploads are object URLs; release them when they go and when the page goes.
  const urlsRef = useRef(new Set<string>());
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);
  const track = (file: File): string => {
    const url = URL.createObjectURL(file);
    urlsRef.current.add(url);
    return url;
  };
  // Only URLs made here are released; a character sheet image belongs to the sheet.
  const release = (url: string) => {
    if (!urlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  };

  const models = useQuery(modelsQuery);
  const generate = useGenerate();

  const tabModels = (models.data ?? []).filter((model) => model.tabs.includes(tab));
  const model = tabModels.find((candidate) => candidate.id === modelId) ?? tabModels[0] ?? null;
  const kinds = kindsFor(tab, videoInput);
  const active = references.filter((reference) => kinds.includes(reference.kind));

  // Typing @ offers the attached references (spec 7.2). Escape dismisses the
  // list for the word being typed.
  const tagQuery = tagQueryAt(prompt, caret);
  const suggestions =
    tagQuery === null || tagQuery.start === dismissedAt ? [] : tagMatches(active, tagQuery.query);
  const highlighted = suggestions[Math.min(highlight, suggestions.length - 1)];
  const acceptSuggestion = (reference: Reference) => {
    if (tagQuery === null) return;
    const next = completeTag(prompt, tagQuery.start, caret, reference.tag);
    setPrompt(next.text);
    setCaret(next.caret);
    setHighlight(0);
    requestAnimationFrame(() => {
      promptRef.current?.focus();
      promptRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };
  const usesFrames = tab === "video" && videoInput === "frames";
  const timed = tab === "video" || tab === "audio";
  const usesResolution = tab !== "audio";
  const durationSec = timed ? duration : null;
  const outputResolution = usesResolution ? resolution : null;

  const issues = model
    ? capabilityIssues(model, {
        tab,
        videoInput,
        referenceCounts: countByKind(active),
        hasFirstFrame: usesFrames && frames.first !== null,
        hasLastFrame: usesFrames && frames.last !== null,
        aspectRatio,
        resolution: outputResolution,
        durationSec,
      })
    : [];
  const strays = kinds.length > 0 ? unknownTags(prompt, active) : [];
  const videoCount = countByKind(active).video;
  const missing =
    tab === "stitch"
      ? videoCount < 2
        ? "Add at least two clips to stitch."
        : null
      : prompt.trim().length === 0
        ? "Describe what to make."
        : null;

  const quote = useQuery({
    ...quoteQuery({
      mode: tab,
      aspectRatio,
      lengthSec: durationSec ?? 1,
      ...(model ? { model: model.id } : {}),
      ...(outputResolution === null ? {} : { resolution: outputResolution }),
    }),
    enabled: model !== null,
  });

  const addFiles = (kind: ReferenceKind, files: readonly File[], fromTray = false) => {
    // Every pick also lands in the top bar's attachments tray.
    if (!fromTray) useAttachmentsStore.getState().add(kind, files);
    setReferences((current) => {
      let next = current;
      for (const file of files.slice(0, remaining(current, kind))) {
        next = [
          ...next,
          {
            id: crypto.randomUUID(),
            kind,
            tag: nextTag(next, kind),
            name: file.name,
            url: track(file),
          },
        ];
      }
      return next;
    });
    if (files.length > remaining(references, kind)) {
      toast(
        `Only ${String(remaining(references, kind))} more ${kind} references fit. The rest were left out.`,
      );
    }
  };

  // The attachments tray asks for a file back by queueing it. Drain the
  // queue on mount (a request made from another page) and whenever it grows.
  const addFilesRef = useRef(addFiles);
  useEffect(() => {
    addFilesRef.current = addFiles;
  });
  useEffect(() => {
    const drain = () => {
      for (const item of useAttachmentsStore.getState().takePending()) {
        addFilesRef.current(item.kind, [item.file], true);
      }
    };
    queueMicrotask(drain);
    return useAttachmentsStore.subscribe((state, previous) => {
      if (state.pending.length > previous.pending.length) drain();
    });
  }, []);

  const tag = (value: string) => {
    const caret = promptRef.current?.selectionStart ?? prompt.length;
    const next = insertTag(prompt, value, caret);
    setPrompt(next.text);
    requestAnimationFrame(() => {
      promptRef.current?.focus();
      promptRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const submit = () => {
    if (missing !== null || issues.length > 0) return;
    generate.mutate(
      {
        tab,
        prompt: prompt.trim(),
        model: model?.id ?? null,
        aspectRatio,
        resolution: outputResolution,
        durationSec,
        videoInput: tab === "video" ? videoInput : null,
        references: active.map(({ kind, tag: refTag, name }) => ({ kind, tag: refTag, name })),
        firstFrame: usesFrames ? (frames.first?.name ?? null) : null,
        lastFrame: usesFrames ? (frames.last?.name ?? null) : null,
      },
      {
        onSuccess: () => {
          toast("Queued. It will show in Recent quick creates.");
        },
        onError: (error) => {
          if (isInsufficientCredits(error)) {
            openTopUp(quote.data?.credits);
            toast("Insufficient credits. Top up to start this. Nothing was charged.");
            return;
          }
          toast("That could not start. Nothing was charged; try again.");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (isQuickTab(next)) void setTab(next);
        }}
      >
        <TabsList
          aria-label="What to make"
          className="grid w-full grid-cols-5 sm:inline-flex sm:w-fit max-sm:[&_svg]:hidden"
        >
          {QUICK_TABS.map((value) => {
            const meta = TAB_META[value];
            const Icon = meta.icon;
            return (
              <TabsTrigger key={value} value={value}>
                <Icon aria-hidden="true" />
                {meta.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <Card className="flex flex-col gap-2">
        {tab === "video" ? (
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            aria-label="Video input"
            className="px-1"
            value={videoInput}
            onValueChange={(next) => {
              if (isVideoInput(next)) void setVideoInput(next);
            }}
          >
            {VIDEO_INPUTS.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {VIDEO_INPUT_LABEL[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}

        {usesFrames ? (
          <div className="rounded-md bg-muted p-1">
            <FrameSlots
              frames={frames}
              aspectRatio={aspectRatio}
              lastFrameSupported={model ? supports(model, "lastFrame") : false}
              modelName={model?.name ?? "This model"}
              onPick={(slot, frame) => {
                setFrames((current) => {
                  const old = current[slot];
                  if (old) release(old.url);
                  return { ...current, [slot]: frame };
                });
              }}
              onSet={(slot: FrameSlot, file) => {
                const url = track(file);
                setFrames((current) => {
                  const old = current[slot];
                  if (old) release(old.url);
                  return { ...current, [slot]: { name: file.name, url } };
                });
              }}
              onClear={(slot) => {
                setFrames((current) => {
                  const old = current[slot];
                  if (old) release(old.url);
                  return { ...current, [slot]: null };
                });
              }}
              onSwap={() => {
                setFrames(swapFrames);
              }}
            />
          </div>
        ) : kinds.length > 0 ? (
          <div className="rounded-md bg-muted p-1">
            <ReferenceTiles
              kinds={kinds}
              references={references}
              onAdd={addFiles}
              onRemove={(reference) => {
                release(reference.url);
                setReferences((current) => current.filter((item) => item.id !== reference.id));
              }}
              onTag={tag}
            />
          </div>
        ) : null}

        <label htmlFor={promptId} className="sr-only">
          Prompt
        </label>
        <Textarea
          id={promptId}
          ref={promptRef}
          value={prompt}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={suggestionsId}
          aria-activedescendant={highlighted ? `${suggestionsId}-${highlighted.id}` : undefined}
          onChange={(event) => {
            setPrompt(event.target.value);
            setCaret(event.target.selectionStart);
            setHighlight(0);
          }}
          onSelect={(event) => {
            setCaret(event.currentTarget.selectionStart);
          }}
          onKeyDown={(event) => {
            if (suggestions.length > 0 && !event.metaKey && !event.ctrlKey) {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setHighlight(
                  (current) => (current + step + suggestions.length) % suggestions.length,
                );
                return;
              }
              if ((event.key === "Enter" || event.key === "Tab") && highlighted) {
                event.preventDefault();
                acceptSuggestion(highlighted);
                return;
              }
              if (event.key === "Escape" && tagQuery !== null) {
                event.preventDefault();
                setDismissedAt(tagQuery.start);
                return;
              }
            }
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              generateRef.current?.click();
            }
          }}
          placeholder={TAB_META[tab].placeholder}
          rows={3}
          className="min-h-24 text-base"
        />
        <ul
          id={suggestionsId}
          role="listbox"
          aria-label="References to tag"
          className={suggestions.length > 0 ? "flex flex-wrap gap-1 px-2" : "hidden"}
        >
          {suggestions.map((reference) => (
            <li
              key={reference.id}
              id={`${suggestionsId}-${reference.id}`}
              role="option"
              aria-selected={reference.id === highlighted?.id}
            >
              <Button
                size="sm"
                variant={reference.id === highlighted?.id ? "default" : "secondary"}
                tabIndex={-1}
                onMouseDown={(event) => {
                  // Keep focus in the prompt so the caret stays put.
                  event.preventDefault();
                }}
                onClick={() => {
                  acceptSuggestion(reference);
                }}
              >
                {reference.tag}
                <span className="max-w-32 truncate font-normal opacity-80">{reference.name}</span>
              </Button>
            </li>
          ))}
        </ul>

        {issues.length > 0 || strays.length > 0 || (models.isSuccess && model === null) ? (
          <ul role="status" className="flex flex-col gap-1 px-2 text-sm">
            {models.isSuccess && model === null ? (
              <Issue tone="destructive">No model can make this yet.</Issue>
            ) : null}
            {issues.map((issue) => (
              <Issue key={issue} tone="destructive">
                {issue}
              </Issue>
            ))}
            {strays.map((stray) => (
              <Issue key={stray} tone="flag">
                {`${stray} does not match an attached reference.`}
              </Issue>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2">
          <div className="flex flex-wrap items-center gap-1">
            {models.isError ? (
              <span className="px-2 text-sm text-muted-foreground">Models did not load.</span>
            ) : model ? (
              <ModelPicker
                models={tabModels}
                value={model}
                onChange={(id) => {
                  void setModelId(id);
                }}
              />
            ) : null}
            <OptionMenu
              label="Aspect ratio"
              value={aspectRatio}
              options={ASPECT_OPTIONS}
              onChange={(value) => {
                void setAspectRatio(value);
              }}
            />
            {usesResolution ? (
              <OptionMenu
                label="Resolution"
                value={resolution}
                options={RESOLUTION_OPTIONS}
                onChange={(value) => {
                  void setResolution(value);
                }}
              />
            ) : null}
            {timed ? (
              <OptionMenu
                label="Duration"
                value={duration}
                options={DURATION_OPTIONS}
                onChange={(value) => {
                  void setDuration(value);
                }}
              />
            ) : null}
            {tab === "stitch" ? null : (
              <MagicPromptButton
                disabled={prompt.trim().length === 0}
                pressed={magicFor !== null}
                onClick={() => {
                  setMagicFor(magicFor === null ? prompt : null);
                }}
              />
            )}
          </div>
          <div className="ms-auto">
            <GenerateBar
              cost={quote.data?.credits ?? null}
              requiresConfirmation={quote.data?.requiresConfirmation ?? false}
              balance={account.data?.credits ?? null}
              blocked={missing !== null || issues.length > 0 || model === null}
              pending={generate.isPending}
              onGenerate={submit}
              triggerRef={generateRef}
            />
          </div>
        </div>
      </Card>

      {magicFor === null || tab === "stitch" ? null : (
        <MagicPrompt
          original={magicFor}
          characterIds={[]}
          onUse={setPrompt}
          onClose={() => {
            setMagicFor(null);
          }}
        />
      )}
    </div>
  );
}

function Issue({
  tone,
  children,
}: {
  readonly tone: "destructive" | "flag";
  readonly children: string;
}) {
  return (
    <li
      className={
        tone === "destructive"
          ? "flex items-start gap-1.5 text-destructive-foreground"
          : "flex items-start gap-1.5 text-flag-foreground"
      }
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </li>
  );
}
