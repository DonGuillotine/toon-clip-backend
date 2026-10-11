"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Lightbulb, Pencil, RefreshCw, Undo2, X } from "lucide-react";
import { useId, useState } from "react";

import { Highlight } from "@/components/comic/highlight";
import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type Segment, type Strength, STRENGTHS } from "@/features/magic-prompt/schema";

import { musicMagicPromptQuery } from "../queries";
import { type Genre, type Mood } from "../schema";

const STRENGTH_LABEL = {
  light: "Light",
  standard: "Standard",
  directed: "Directed",
} satisfies Record<Strength, string>;

function isStrength(value: string): value is Strength {
  return STRENGTHS.some((strength) => strength === value);
}

/**
 * Magic Prompt for music (spec 7.4), drawing on music recipes: the original
 * and the suggestion side by side, every change numbered with its reason.
 * It is always a suggestion: nothing changes until "Use this", and "Revert"
 * puts the original back.
 */
export function MusicMagicPrompt({
  original,
  genre,
  mood,
  onUse,
  onClose,
}: {
  readonly original: string;
  readonly genre: Genre;
  readonly mood: Mood;
  readonly onUse: (text: string) => void;
  readonly onClose: () => void;
}) {
  const titleId = useId();
  const editId = useId();
  const [strength, setStrength] = useState<Strength>("standard");
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const suggestion = useQuery(
    musicMagicPromptQuery({ prompt: original, genre, mood, strength, attempt }),
  );
  const result = suggestion.data;

  return (
    <Card aria-labelledby={titleId} className="flex flex-col gap-2 bg-muted text-start">
      <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-2 py-1">
        <h3 id={titleId} className="font-display text-xl">
          Magic Prompt
        </h3>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            aria-label="Strength"
            value={strength}
            onValueChange={(next) => {
              if (isStrength(next)) {
                setStrength(next);
                setDraft(null);
              }
            }}
          >
            {STRENGTHS.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {STRENGTH_LABEL[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button variant="ghost" size="icon-sm" aria-label="Close Magic Prompt" onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div aria-live="polite" aria-busy={suggestion.isFetching} className="flex flex-col gap-2">
        {suggestion.isError && !result ? (
          <div className="flex flex-col items-start gap-2 rounded-md bg-card p-3">
            <p className="text-sm">Magic Prompt did not load.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void suggestion.refetch();
              }}
            >
              Try again
            </Button>
          </div>
        ) : !result ? (
          <div className="flex flex-col gap-2">
            <p className="px-2 text-sm text-muted-foreground">Scoring your prompt…</p>
            <Skeleton className="h-24 rounded-md" />
          </div>
        ) : result.status === "declined" ? (
          <div className="flex items-start gap-2 rounded-md bg-card p-3 text-sm">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>{result.reason}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-md bg-card p-3">
                <h4 className="text-xs text-muted-foreground">Your prompt</h4>
                <p className="text-sm leading-relaxed">
                  <Segments segments={result.original} marked="struck" />
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-card p-3">
                {draft === null ? (
                  <>
                    <h4 className="text-xs text-muted-foreground">Suggestion</h4>
                    <p className="text-sm leading-loose">
                      <Segments segments={result.suggestion} marked="highlight" />
                    </p>
                  </>
                ) : (
                  <>
                    <Label htmlFor={editId} className="text-xs text-muted-foreground">
                      Edit the suggestion
                    </Label>
                    <Textarea
                      id={editId}
                      value={draft}
                      className="text-sm"
                      onChange={(event) => {
                        setDraft(event.target.value);
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {result.changes.length > 0 ? (
              <ol className="flex flex-col gap-1 px-2 text-sm" aria-label="What changed and why">
                {result.changes.map((change) => (
                  <li key={change.id} className="flex gap-2">
                    <span className="tabular w-5 shrink-0 text-muted-foreground">{change.id}.</span>
                    <span>{change.reason}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-2 text-sm text-muted-foreground">
                Your prompt already reads well at this strength. Try Directed for more.
              </p>
            )}

            {result.assumptions.length > 0 ? (
              <div className="flex flex-col gap-1 px-2 text-sm">
                <p className="flex items-center gap-1.5 font-medium">
                  <Lightbulb aria-hidden="true" className="size-4" /> Assumed, since the prompt was
                  short
                </p>
                <ul className="list-disc ps-6 text-muted-foreground">
                  {result.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.warnings.map((warning) => (
              <p
                key={warning}
                className="flex items-start gap-2 rounded-md bg-flag/12 p-3 text-sm text-flag-foreground"
              >
                <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {warning}
              </p>
            ))}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md bg-card p-2">
        <Button
          size="sm"
          disabled={result?.status !== "improved"}
          onClick={() => {
            if (result?.status !== "improved") return;
            onUse(draft ?? result.improved);
            setApplied(true);
          }}
        >
          Use this
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={result?.status !== "improved" || draft !== null}
          onClick={() => {
            if (result?.status === "improved") setDraft(result.improved);
          }}
        >
          <Pencil aria-hidden="true" /> Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={suggestion.isFetching || result?.status === "declined"}
          onClick={() => {
            setDraft(null);
            setAttempt((current) => current + 1);
          }}
        >
          <RefreshCw aria-hidden="true" /> Try another
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!applied}
          onClick={() => {
            onUse(original);
            setApplied(false);
          }}
        >
          <Undo2 aria-hidden="true" /> Revert
        </Button>
        {applied ? (
          <p className="ms-auto px-1 text-xs text-muted-foreground">In your prompt now.</p>
        ) : null}
      </div>
    </Card>
  );
}

function Segments({
  segments,
  marked,
}: {
  readonly segments: readonly Segment[];
  readonly marked: "highlight" | "struck";
}) {
  return segments.map((segment, index) => {
    if (segment.change === null) return <span key={index}>{segment.text}</span>;
    const number = (
      <sup className="tabular ms-0.5 text-xs text-muted-foreground">{segment.change}</sup>
    );
    return marked === "highlight" ? (
      <span key={index}>
        <Highlight className="px-0.5">{segment.text}</Highlight>
        {number}
      </span>
    ) : (
      <span key={index}>
        <s className="text-muted-foreground">{segment.text}</s>
        {number}
      </span>
    );
  });
}
