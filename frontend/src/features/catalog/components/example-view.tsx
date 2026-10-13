"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Flag,
  Layers,
  Scissors,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { type ReactNode, useId, useState } from "react";

import { MarginNote } from "@/components/comic/margin-note";
import { LoadError } from "@/components/load-state";
import { Card, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CostNotice, useCanAfford } from "@/features/credits/components/cost-notice";
import { useCreateProject } from "@/features/projects/mutations";
import { formatSeconds } from "@/features/projects/shots";
import { apiErrorDetail, newIdempotencyKey } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { beatClipUrl } from "../beat-clips";
import { type Beat, formatClock, parseBeats } from "../beats";
import { characterFor, type ChoiceField, choiceFields, pickSelection } from "../choices";
import { catalogQuery, promptPreviewQuery } from "../queries";
import { type Scenario, type Selection } from "../schema";
import { nextStep, previousStep, type Step, STEP_HEADINGS, STEP_TITLES, STEPS } from "../steps";
import { CharacterArt } from "./character-art";

/**
 * One example, walked through in three steps (the tour runs on this too):
 * the character and the idea, Magic Prompt, and the result, where the
 * project is made. The step and the choice live in the URL, so a shared
 * link opens the same step.
 */
export function ExampleView({ scenarioId }: { readonly scenarioId: string }) {
  const catalog = useQuery(catalogQuery);

  if (catalog.isPending) return <ExampleSkeleton />;
  if (catalog.isError) {
    return (
      <Card>
        <LoadError onRetry={() => void catalog.refetch()}>This example did not load.</LoadError>
      </Card>
    );
  }
  const scenario = catalog.data.scenarios.items.find((item) => item.id === scenarioId);
  if (scenario === undefined) notFound();

  return <Example scenario={scenario} createCost={catalog.data.prices.createCredits} />;
}

function ExampleSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-9 w-96 max-w-full rounded-md" />
      <Skeleton className="h-14 w-full max-w-lg rounded-md" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

function Example({
  scenario,
  createCost,
}: {
  readonly scenario: Scenario;
  readonly createCost: number;
}) {
  const [choice, setChoice] = useQueryState("choice", parseAsString);
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(STEPS).withDefault("1").withOptions({ history: "push", scroll: true }),
  );
  const selection =
    scenario.selections.find((item) => item.id === choice) ?? scenario.selections[0] ?? null;
  const go = (next: Step) => {
    void setStep(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-6">
      <StepBar scenario={scenario} step={step} onGo={go} />
      <header className="flex flex-col gap-3">
        <span className="kicker">{scenario.title}</span>
        <h1 className="font-display text-4xl text-balance md:text-5xl">{STEP_HEADINGS[step]}</h1>
      </header>

      {selection === null ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            This example has no versions to show yet. Pick another one from home.
          </p>
        </Card>
      ) : (
        <StepBody
          step={step}
          scenario={scenario}
          selection={selection}
          createCost={createCost}
          onChoose={(next) => void setChoice(next.id)}
          onGo={go}
        />
      )}

      <StepNav step={step} onGo={go} />
    </div>
  );
}

/** Where you are in the three steps, and a way out. On every step. */
function StepBar({
  scenario,
  step,
  onGo,
}: {
  readonly scenario: Scenario;
  readonly step: Step;
  readonly onGo: (step: Step) => void;
}) {
  return (
    <nav aria-label="Steps" className="flex flex-wrap items-center gap-2">
      {scenario.isTour ? (
        <Badge variant="spot">
          <Sparkles aria-hidden="true" /> Free tour
        </Badge>
      ) : (
        <Badge variant="spot">
          <Sparkles aria-hidden="true" /> Example
        </Badge>
      )}
      <ol className="flex flex-wrap items-center gap-1">
        {STEPS.map((item) => {
          const current = item === step;
          const done = item < step;
          return (
            <li key={item}>
              <Button
                variant="ghost"
                size="sm"
                aria-current={current ? "step" : undefined}
                onClick={() => {
                  onGo(item);
                }}
                className={cn(
                  "h-9 rounded-xs px-2.5 font-sans text-xs font-medium tracking-normal normal-case",
                  current
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Check aria-hidden="true" className="size-3" /> : null}
                <span>
                  {item}
                  <span className="sr-only md:not-sr-only">. {STEP_TITLES[item]}</span>
                  {done ? <span className="sr-only">, done</span> : null}
                </span>
              </Button>
            </li>
          );
        })}
      </ol>
      <Button asChild variant="ghost" size="sm" className="ms-auto">
        <Link href="/#examples">All examples</Link>
      </Button>
    </nav>
  );
}

function StepNav({ step, onGo }: { readonly step: Step; readonly onGo: (step: Step) => void }) {
  const previous = previousStep(step);
  const next = nextStep(step);
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {previous === null ? (
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft aria-hidden="true" /> Home
          </Link>
        </Button>
      ) : (
        <Button
          variant="ghost"
          onClick={() => {
            onGo(previous);
          }}
        >
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
      )}
      {next === null ? null : (
        <Button
          size="lg"
          // On step 1 the main action is Magic Prompt itself; this is the quiet way on.
          variant={step === "1" ? "secondary" : "default"}
          className="ms-auto"
          onClick={() => {
            onGo(next);
          }}
        >
          Next: {STEP_TITLES[next]} <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function StepBody({
  step,
  scenario,
  selection,
  createCost,
  onChoose,
  onGo,
}: {
  readonly step: Step;
  readonly scenario: Scenario;
  readonly selection: Selection;
  readonly createCost: number;
  readonly onChoose: (next: Selection) => void;
  readonly onGo: (step: Step) => void;
}) {
  switch (step) {
    case "1":
      return (
        <CharacterAndIdea
          scenario={scenario}
          selection={selection}
          onChoose={onChoose}
          onImprove={() => {
            onGo("2");
          }}
        />
      );
    case "2":
      return <MagicPromptStep scenarioId={scenario.id} selection={selection} />;
    case "3":
      return <ResultStep scenario={scenario} selection={selection} createCost={createCost} />;
  }
}

/* ── Step 1 ─────────────────────────────────────────────────────────────── */

function CharacterAndIdea({
  scenario,
  selection,
  onChoose,
  onImprove,
}: {
  readonly scenario: Scenario;
  readonly selection: Selection;
  readonly onChoose: (next: Selection) => void;
  readonly onImprove: () => void;
}) {
  const baseId = useId();
  const character = characterFor(scenario, selection);
  const fields = choiceFields(scenario);
  // Fields with a real choice get a picker; the rest are shown as set.
  const pickable = fields.filter((field) => field.options.length > 1);
  const fixed = fields.filter(
    (field) => field.options.length <= 1 && field.field !== "character" && field.field !== "idea",
  );
  const idea = fields
    .find((field) => field.field === "idea")
    ?.options.find((option) => option.id === selection.values["idea"]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Character sheet" titleId={`${baseId}-character`}>
          {character === null ? (
            <p className="p-3 text-sm text-muted-foreground">This example names no character.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <CharacterArt
                name={character.name}
                imageUrl={character.imageUrl}
                sizes="(min-width: 768px) 45vw, 100vw"
                className="aspect-4/3 rounded-sm"
              />
              <p className="px-2 pb-1 text-sm font-medium">{character.name}</p>
            </div>
          )}
        </Section>
        <Section title="Your idea" titleId={`${baseId}-idea`}>
          <div className="flex h-full flex-col items-start gap-3 p-3">
            {idea === undefined ? null : <p className="text-lg font-medium">{idea.label}</p>}
            <blockquote className="border-s-2 border-edge-control ps-3 text-muted-foreground">
              {selection.prompt.original}
            </blockquote>
            {fixed.length === 0 ? null : (
              <ul aria-label="Settings" className="flex flex-wrap gap-1">
                {fixed.map((field) => {
                  const option = field.options.find(
                    (item) => item.id === selection.values[field.field],
                  );
                  return option === undefined ? null : (
                    <li key={field.field}>
                      <Badge>{option.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button variant="spot" size="lg" className="mt-auto" onClick={onImprove}>
              <WandSparkles aria-hidden="true" /> Magic Prompt
            </Button>
          </div>
        </Section>
      </div>
      {pickable.length === 0 ? null : (
        <ChoicePicker
          scenario={scenario}
          selection={selection}
          fields={pickable}
          onChange={onChoose}
        />
      )}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Tip.</span> A short prompt leaves the camera,
        the light and the action to chance, so the model fills them with the most generic choice.
        Magic Prompt fills them in on purpose.
      </p>
      <MarginNote>Press Magic Prompt to see what changes</MarginNote>
    </div>
  );
}

/**
 * One group per choice field with more than one option. Picking an option
 * moves to the supported selection that keeps the other picks when it can;
 * only supported combinations exist, so the others follow along.
 */
function ChoicePicker({
  scenario,
  selection,
  fields,
  onChange,
}: {
  readonly scenario: Scenario;
  readonly selection: Selection;
  readonly fields: readonly ChoiceField[];
  readonly onChange: (next: Selection) => void;
}) {
  const baseId = useId();

  return (
    <Section title="Choose" titleId={`${baseId}-heading`} well={false}>
      <div className="grid gap-2 md:grid-cols-2">
        {fields.map(({ field, label, options }) => {
          const groupId = `${baseId}-${field}`;
          return (
            <div key={field} className="flex flex-col gap-1 rounded-md bg-muted p-1">
              <h3
                id={groupId}
                className="px-3 pt-2 pb-1 font-label text-sm tracking-label text-muted-foreground"
              >
                {label}
              </h3>
              <RadioGroup
                aria-labelledby={groupId}
                value={selection.values[field] ?? ""}
                onValueChange={(optionId) => {
                  const next = pickSelection(scenario, selection, field, optionId);
                  if (next !== null) onChange(next);
                }}
                className="flex flex-col gap-1"
              >
                {options.map((option) => {
                  const id = `${groupId}-${option.id}`;
                  return (
                    <Label
                      key={option.id}
                      htmlFor={id}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 leading-normal font-normal hover:bg-card",
                        selection.values[field] === option.id && "bg-card",
                      )}
                    >
                      <RadioGroupItem id={id} value={option.id} />
                      {option.media === undefined ? null : (
                        <CharacterArt
                          name={option.label}
                          imageUrl={option.media.url}
                          sizes="32px"
                          className="size-8 shrink-0 rounded-xs"
                        />
                      )}
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Step 2 ─────────────────────────────────────────────────────────────── */

function MagicPromptStep({
  scenarioId,
  selection,
}: {
  readonly scenarioId: string;
  readonly selection: Selection;
}) {
  const baseId = useId();
  const preview = useQuery(promptPreviewQuery(scenarioId, selection.id));

  if (preview.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading Magic Prompt">
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-64 rounded-xl lg:col-span-5" />
          <Skeleton className="h-64 rounded-xl lg:col-span-7" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }
  if (preview.isError) {
    return (
      <Card>
        <LoadError onRetry={() => void preview.refetch()}>Magic Prompt did not load.</LoadError>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 lg:grid-cols-12">
        <Section title="Your prompt" titleId={`${baseId}-original`} className="lg:col-span-5">
          <p className="p-3 text-muted-foreground">{preview.data.original}</p>
        </Section>
        <Section
          title="Improved prompt"
          titleId={`${baseId}-improved`}
          className="shadow-pop lg:col-span-7"
        >
          <ImprovedPrompt text={preview.data.improved} labelledBy={`${baseId}-improved`} />
        </Section>
      </div>
      {preview.data.changes.length === 0 ? null : (
        <Section
          title="Why each change"
          titleId={`${baseId}-changes`}
          count={preview.data.changes.length}
        >
          <ol className="grid gap-1 sm:grid-cols-2">
            {preview.data.changes.map((change, index) => (
              <li
                // Reasons are positional: the preview is saved and never reordered.
                key={index}
                className="flex gap-3 rounded-sm p-3"
              >
                <span
                  aria-hidden="true"
                  className="tabular grid size-5 shrink-0 place-items-center rounded-xs bg-spot font-label text-xs text-spot-foreground"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 text-sm">{change}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Tip.</span> Each timed beat becomes a part of
        the clip. In your project you can cut the clip where the beats change and work on one part
        at a time.
      </p>
    </div>
  );
}

/** The improved prompt, laid out beat by beat when it is written in timed beats. */
function ImprovedPrompt({
  text,
  labelledBy,
}: {
  readonly text: string;
  readonly labelledBy: string;
}) {
  const { lead, beats } = parseBeats(text);
  if (beats.length === 0) {
    return <p className="p-3 leading-relaxed whitespace-pre-line">{text}</p>;
  }
  return (
    <div
      // Long prompts scroll inside the panel; focusable so the keyboard can scroll it.
      tabIndex={0}
      role="region"
      aria-labelledby={labelledBy}
      className="flex max-h-120 flex-col gap-1 overflow-y-auto rounded-sm"
    >
      {lead === "" ? null : <p className="px-3 pt-2 pb-1 text-sm font-medium">{lead}</p>}
      <ol className="flex flex-col gap-1">
        {beats.map((beat) => (
          <li key={beat.startSeconds} className="flex flex-col gap-2 rounded-sm bg-card p-3">
            <BeatTime beat={beat} />
            <BeatFields beat={beat} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function BeatTime({ beat }: { readonly beat: Beat }) {
  return (
    <span className="tabular self-start rounded-xs bg-primary-tint px-1.5 py-0.5 font-label text-xs tracking-label text-primary">
      {formatClock(beat.startSeconds)} to {formatClock(beat.endSeconds)}
    </span>
  );
}

function BeatFields({ beat }: { readonly beat: Beat }) {
  return (
    <dl className="grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
      {beat.fields.map((field) => (
        <div key={field.label} className="contents">
          <dt className="font-label text-xs tracking-label text-muted-foreground sm:pt-0.5">
            {field.label}
          </dt>
          <dd>{field.text}</dd>
        </div>
      ))}
      {beat.notes.map((note) => (
        <dd key={note} className="sm:col-span-2">
          {note}
        </dd>
      ))}
    </dl>
  );
}

/* ── Step 3 ─────────────────────────────────────────────────────────────── */

function ResultStep({
  scenario,
  selection,
  createCost,
}: {
  readonly scenario: Scenario;
  readonly selection: Selection;
  readonly createCost: number;
}) {
  const baseId = useId();
  const shots = selection.shots?.items ?? [];
  const defaultTake = shots[0]?.takes.find((take) => take.id === shots[0]?.defaultTakeId);
  const beats = parseBeats(defaultTake?.prompt ?? selection.prompt.improved).beats;
  const canExport = !scenario.isTour;

  return (
    <div className="flex flex-col gap-4">
      {beats.length === 0 ? null : <BeatStrip scenarioId={scenario.id} beats={beats} />}
      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          {shots.length === 0 ? null : (
            <Section title="What you get" titleId={`${baseId}-get`} count={shots.length}>
              <ul className="flex flex-col gap-1">
                {shots.map((shot) => (
                  <li key={shot.id} className="flex flex-col gap-1 rounded-sm p-3">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{shot.label}</span>
                      <span className="tabular text-xs text-muted-foreground">
                        {formatSeconds(shot.durationSeconds)}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {shot.takes.length === 1
                        ? "1 prepared version: "
                        : `${String(shot.takes.length)} prepared versions: `}
                      {shot.takes.map((take) => take.label).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section title="What you can do next" titleId={`${baseId}-next`}>
            <ul className="flex flex-col gap-1">
              <NextItem icon={<Scissors aria-hidden="true" />}>
                <strong className="font-medium">Cut the clip</strong> at any moment and work on one
                segment at a time.
              </NextItem>
              <NextItem icon={<Flag aria-hidden="true" />}>
                <strong className="font-medium">Flag a shot</strong> and revise only that one.
                Nothing else changes.
              </NextItem>
              <NextItem icon={<Layers aria-hidden="true" />}>
                <strong className="font-medium">Switch versions</strong> and keep your favourite.
                Every take is kept.
              </NextItem>
              {canExport ? (
                <NextItem icon={<Download aria-hidden="true" />}>
                  <strong className="font-medium">Export</strong> the finished clip as an MP4.
                </NextItem>
              ) : null}
            </ul>
          </Section>
        </div>
        <CreatePanel
          // Remounted per selection: one idempotency key per thing being bought.
          key={selection.id}
          scenarioId={scenario.id}
          selectionId={selection.id}
          cost={scenario.isTour ? 0 : createCost}
          isTour={scenario.isTour}
          className="lg:col-span-5"
        />
      </div>
    </div>
  );
}

function NextItem({ icon, children }: { readonly icon: ReactNode; readonly children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-sm p-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
      {icon}
      <span>{children}</span>
    </li>
  );
}

/**
 * The clip as its timed beats, laid out like the project's timeline: each
 * beat as wide as it is long. Pick one to read what happens in it.
 */
function BeatStrip({
  scenarioId,
  beats,
}: {
  readonly scenarioId: string;
  readonly beats: readonly Beat[];
}) {
  const titleId = useId();
  const [picked, setPicked] = useQueryState("beat", parseAsInteger.withDefault(1));
  const index = Math.min(Math.max(picked, 1), beats.length);
  const beat = beats[index - 1] ?? null;
  const last = beats.at(-1);
  const clip = beatClipUrl(scenarioId, index);

  return (
    <Section
      title="The clip, beat by beat"
      titleId={titleId}
      description={`${String(beats.length)} beats${last === undefined ? "" : ` over ${formatClock(last.endSeconds)}`}. In your project, each one can be cut out and fixed on its own.`}
      well={false}
    >
      <div className="flex flex-col gap-2">
        <ToggleGroup
          type="single"
          aria-label="Beats"
          value={String(index)}
          onValueChange={(next) => {
            const number = Number(next);
            if (Number.isInteger(number) && number >= 1) void setPicked(number);
          }}
          spacing={0}
          className="flex w-full overflow-hidden rounded-sm bg-muted"
        >
          {beats.map((item, index) => (
            <ToggleGroupItem
              key={item.startSeconds}
              value={String(index + 1)}
              aria-label={`Beat ${String(index + 1)}, ${formatClock(item.startSeconds)} to ${formatClock(item.endSeconds)}`}
              style={{ flexGrow: item.endSeconds - item.startSeconds }}
              className={cn(
                "h-14 min-w-0 basis-0 flex-col items-start justify-between rounded-none bg-settled px-2 py-1.5 text-start text-foreground",
                index > 0 && "border-s-2 border-canvas",
              )}
            >
              <span className="tabular truncate font-label text-sm tracking-label">
                {index + 1}
              </span>
              <span className="tabular hidden truncate text-xs opacity-80 sm:block">
                {formatClock(item.startSeconds)}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {beat === null ? null : (
          <div
            className={cn("grid gap-3 rounded-md bg-muted p-3", clip !== null && "md:grid-cols-2")}
          >
            {clip === null ? null : (
              <video
                // Remounted per beat so the new clip starts from its first frame.
                key={clip}
                src={clip}
                aria-label={`Beat ${String(index)} clip`}
                className="aspect-video w-full rounded-sm bg-canvas object-contain"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              />
            )}
            <div className="flex flex-col gap-2" aria-live="polite">
              <BeatTime beat={beat} />
              <BeatFields beat={beat} />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function CreatePanel({
  scenarioId,
  selectionId,
  cost,
  isTour,
  className,
}: {
  readonly scenarioId: string;
  readonly selectionId: string;
  readonly cost: number;
  readonly isTour: boolean;
  readonly className?: string;
}) {
  const titleId = useId();
  const router = useRouter();
  const create = useCreateProject();
  const canAfford = useCanAfford(cost);
  // Kept across retries of this one purchase, so a retry is never a second charge.
  const [idempotencyKey] = useState(newIdempotencyKey);

  return (
    <Card aria-labelledby={titleId} className={cn("flex flex-col gap-4 shadow-pop", className)}>
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="font-display text-2xl">
          Make it yours
        </h2>
        <p className="text-sm text-muted-foreground">
          {isTour
            ? "A free tour project: cut it, switch versions and revise shots at no cost. Tour projects cannot be exported."
            : "Create the project to watch the clip, cut it into segments and fix any part without starting over."}
        </p>
      </div>
      <CostNotice cost={cost} />
      {create.isError ? (
        <p role="alert" className="text-sm text-destructive-foreground">
          {apiErrorDetail(create.error) ?? "The project was not created."} Try again: you are only
          charged once.
        </p>
      ) : null}
      <Button
        size="lg"
        className="self-start"
        disabled={canAfford !== true || create.isPending || create.isSuccess}
        onClick={() => {
          create.mutate(
            { scenarioId, selectionId, idempotencyKey },
            {
              onSuccess: ({ id }) => {
                router.push(`/projects/${encodeURIComponent(id)}`);
              },
            },
          );
        }}
      >
        {create.isPending || create.isSuccess ? "Creating…" : "Create project"}
      </Button>
    </Card>
  );
}
