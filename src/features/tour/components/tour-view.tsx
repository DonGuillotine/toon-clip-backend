"use client";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  type LucideIcon,
  Sparkles,
  Sun,
  Swords,
  User,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { CoverArt } from "@/components/comic/cover-art";
import { MarginNote } from "@/components/comic/margin-note";
import { Card, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Portrait } from "@/features/characters/components/portrait";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  DEMO_SHOTS,
  IMPROVED_PROMPT,
  NEXT_STEPS,
  NOTE_KINDS,
  type NoteKind,
  NOTES,
  nextStep,
  previousStep,
  SAMPLE_CHARACTER,
  SAMPLE_IDEA,
  STEP_TITLES,
  TOUR_STEPS,
  type TourStep,
} from "../content";

const NOTE_ICONS = {
  camera: Camera,
  lighting: Sun,
  character: User,
  action: Swords,
} satisfies Record<NoteKind, LucideIcon>;

const STEP_BLURBS = {
  "1": "Start with Kaito's character sheet and a short, lazy idea.",
  "2": "Magic Prompt directs the idea and explains every change.",
  "3": "Get a storyboard of shots you can fix one at a time.",
} satisfies Record<TourStep, string>;

/** The tour: a welcome, then three steps, all in the URL as `?step=`. */
export function TourView() {
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(TOUR_STEPS).withOptions({ history: "push", scroll: true }),
  );
  const go = (next: TourStep | null) => {
    void setStep(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <TourBar step={step} />
      {step === null ? (
        <Welcome
          onStart={() => {
            go("1");
          }}
        />
      ) : (
        <>
          <StepBody step={step} onNext={go} />
          <StepNav step={step} onGo={go} />
        </>
      )}
    </div>
  );
}

/** Sample content label, three-step indicator and Skip tour: on every screen. */
function TourBar({ step }: { readonly step: TourStep | null }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="spot">
        <Sparkles aria-hidden="true" /> Sample content
      </Badge>
      <ol aria-label="Tour steps" className="flex items-center gap-2">
        {TOUR_STEPS.map((item) => {
          const current = item === step;
          const done = step !== null && item < step;
          return (
            <li
              key={item}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
                current
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {done ? <Check aria-hidden="true" className="size-3" /> : null}
              <span>
                {item}
                <span className="sr-only md:not-sr-only">. {STEP_TITLES[item]}</span>
                {done ? <span className="sr-only">, done</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <Button asChild variant="ghost" size="sm" className="ms-auto">
        <Link href="/">Skip tour</Link>
      </Button>
    </div>
  );
}

function Welcome({ onStart }: { readonly onStart: () => void }) {
  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">See how Toon Clip works</h1>
        <p className="max-w-xl text-muted-foreground">
          A short demo with a sample character and a sample idea. Everything is pre-made, so nothing
          generates and no credits are spent.
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {TOUR_STEPS.map((item) => (
          <li key={item} className="flex flex-col gap-1 rounded-md bg-muted p-4">
            <span className="text-xs text-muted-foreground">Step {item}</span>
            <span className="text-sm font-medium">{STEP_TITLES[item]}</span>
            <span className="text-sm text-muted-foreground">{STEP_BLURBS[item]}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={onStart}>
          Start the demo <ArrowRight aria-hidden="true" />
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/">Skip tour</Link>
        </Button>
      </div>
    </Card>
  );
}

function StepBody({
  step,
  onNext,
}: {
  readonly step: TourStep;
  readonly onNext: (step: TourStep) => void;
}) {
  switch (step) {
    case "1":
      return (
        <CharacterAndIdea
          onImprove={() => {
            onNext("2");
          }}
        />
      );
    case "2":
      return <MagicPromptStep />;
    case "3":
      return <ResultStep />;
  }
}

function StepNav({
  step,
  onGo,
}: {
  readonly step: TourStep;
  readonly onGo: (step: TourStep | null) => void;
}) {
  const next = nextStep(step);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        onClick={() => {
          onGo(previousStep(step));
        }}
      >
        <ArrowLeft aria-hidden="true" /> Back
      </Button>
      <div className="ms-auto flex gap-2">
        {next === null ? (
          <Button asChild size="lg">
            <Link href="/create">
              Make my own <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button
            size="lg"
            variant={step === "1" ? "secondary" : "default"}
            onClick={() => {
              onGo(next);
            }}
          >
            Next: {STEP_TITLES[next]} <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

function CharacterAndIdea({ onImprove }: { readonly onImprove: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Step 1: a character and an idea</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Character sheet" titleId="tour-character">
          <div className="flex items-center gap-3 p-3">
            <Portrait character={SAMPLE_CHARACTER} />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{SAMPLE_CHARACTER.name}</span>
              <span className="text-xs text-muted-foreground">{SAMPLE_CHARACTER.look}</span>
              <span className="text-xs text-muted-foreground">
                {SAMPLE_CHARACTER.outfitCount} outfits, {SAMPLE_CHARACTER.expressionCount}{" "}
                expressions
              </span>
            </div>
          </div>
        </Section>
        <Section title="Your idea" titleId="tour-idea">
          <div className="flex flex-col items-start gap-4 p-4">
            <p className="text-lg">{SAMPLE_IDEA}</p>
            <Button variant="spot" size="lg" onClick={onImprove}>
              <WandSparkles aria-hidden="true" /> Magic Prompt
            </Button>
          </div>
        </Section>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Tip.</span> A short prompt leaves the camera,
        the light and the action to chance, so the model fills them with the most generic choice.
        Magic Prompt fills them in on purpose.
      </p>
      <MarginNote>Press Magic Prompt to see what changes</MarginNote>
    </div>
  );
}

function MagicPromptStep() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Step 2: Magic Prompt</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Your prompt" titleId="tour-original">
          <p className="p-3 text-muted-foreground opacity-70">{SAMPLE_IDEA}</p>
        </Section>
        <Section title="Improved prompt" titleId="tour-improved">
          <p className="p-3 leading-relaxed">
            {IMPROVED_PROMPT.map((segment) =>
              segment.change === null ? (
                <span key={segment.text}>{segment.text}</span>
              ) : (
                <mark key={segment.text} className="rounded-xs bg-spot/60 text-foreground">
                  {segment.text}
                  <span className="sr-only">(added: {NOTES[segment.change].label})</span>
                </mark>
              ),
            )}
          </p>
        </Section>
      </div>
      <Section title="Why each change" titleId="tour-notes" count={NOTE_KINDS.length}>
        <ul className="grid gap-1 sm:grid-cols-2">
          {NOTE_KINDS.map((kind) => {
            const Icon = NOTE_ICONS[kind];
            return (
              <li key={kind} className="flex gap-3 rounded-sm p-3">
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{NOTES[kind].label}</span>
                  <span className="text-sm text-muted-foreground">{NOTES[kind].note}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
      <p className="text-sm text-muted-foreground">
        In your own work you can <span className="font-medium text-foreground">edit</span> the
        improved prompt, <span className="font-medium text-foreground">try another</span> version,
        or <span className="font-medium text-foreground">revert</span> to what you wrote.
      </p>
    </div>
  );
}

function ResultStep() {
  const total = DEMO_SHOTS.reduce((sum, shot) => sum + shot.durationSec, 0);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Step 3: the result</h1>
      <Card className="flex flex-col gap-3 p-3">
        <CoverArt art="burst" sfx="CLASH" className="aspect-video w-full rounded-lg" />
        <div className="flex flex-col gap-2 px-2 pb-2">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Timeline</span>
            <span className="tabular">{formatDuration(total)}</span>
          </div>
          <ol aria-label="Shots" className="flex gap-1">
            {DEMO_SHOTS.map((shot, index) => {
              const meta = SHOT_STATE_META[shot.state];
              const Icon = meta.icon;
              return (
                <li
                  key={shot.id}
                  style={{ flexGrow: shot.durationSec }}
                  className="flex min-w-0 basis-0 flex-col gap-1"
                >
                  <span className={cn("h-3 rounded-full", meta.fill)} aria-hidden="true" />
                  <span className={cn("flex items-center gap-1 truncate text-xs", meta.tone)}>
                    <Icon aria-hidden="true" className="size-3 shrink-0" />
                    Shot {index + 1}, {meta.label.toLowerCase()}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </Card>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Tip.</span> Shot 3 is flagged: Kaito&apos;s
        headband changed colour. You regenerate only that shot, and the rest stay as they are.
      </p>
      <Section title="What you can do next" titleId="tour-next">
        <ul className="flex flex-col gap-1">
          {NEXT_STEPS.map((item) => (
            <li key={item} className="flex gap-3 rounded-sm p-3 text-sm">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {item}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
