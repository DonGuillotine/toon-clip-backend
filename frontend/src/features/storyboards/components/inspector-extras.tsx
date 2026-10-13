"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Lightbulb, Scissors, Sparkles } from "lucide-react";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Portrait } from "@/features/characters/components/portrait";
import { charactersQuery } from "@/features/characters/queries";
import { type CharacterSummary } from "@/features/characters/schema";
import { MagicPrompt } from "@/features/magic-prompt/components/magic-prompt";
import { MagicPromptButton } from "@/features/magic-prompt/components/magic-prompt-button";
import { useHydrated } from "@/lib/use-hydrated";

import { type ContinuityNote } from "../continuity";
import { type FrameRef } from "../schema";
import { MAX_SHOT_SEC, MIN_SHOT_SEC } from "../timeline";
import { ArtThumb } from "./shot-bits";

/**
 * The cast of a shot, read from the shared characters query. The dock reads
 * the same query, so this waits for hydration (AGENTS.md §3).
 */
function useShotCast(characterIds: readonly string[]): {
  readonly cast: readonly CharacterSummary[] | null;
  readonly failed: boolean;
} {
  const hydrated = useHydrated();
  const characters = useQuery(charactersQuery);
  if (!hydrated || characters.isPending) return { cast: null, failed: false };
  if (characters.isError) return { cast: [], failed: true };
  return {
    cast: characters.data.filter((character) => characterIds.includes(character.id)),
    failed: false,
  };
}

/**
 * A chip per character in the shot, and the palette strip their sheets
 * define (spec 7.5, continuity helpers).
 */
export function ShotCast({ characterIds }: { readonly characterIds: readonly string[] }) {
  const { cast, failed } = useShotCast(characterIds);

  if (cast === null) return <Skeleton className="h-10 rounded-sm" />;
  if (failed) {
    return (
      <p className="rounded-sm bg-card p-3 text-xs text-muted-foreground">
        The cast did not load, so characters and palette are hidden for now.
      </p>
    );
  }
  if (cast.length === 0) {
    return (
      <p className="rounded-sm bg-card p-3 text-xs text-muted-foreground">
        No character sheet on this shot. Faces and outfits may drift between shots.
      </p>
    );
  }

  const palette = [...new Set(cast.flatMap((character) => character.palette))];
  return (
    <div className="flex flex-col gap-2 rounded-sm bg-card p-2">
      <ul aria-label="Characters in this shot" className="flex flex-wrap gap-1">
        {cast.map((character) => (
          <li
            key={character.id}
            className="flex items-center gap-1.5 rounded-xs bg-muted py-0.5 ps-1.5 pe-3"
          >
            <Portrait character={character} size="sm" />
            <span className="text-xs font-medium">{character.name}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Palette from the sheets</span>
        <ul aria-label="Palette" className="flex h-4 overflow-hidden rounded-xs">
          {palette.map((colour) => (
            <li
              key={colour}
              title={colour}
              aria-label={colour}
              className="flex-1"
              // Swatches are the character's own colours: data, not chrome.
              style={{ backgroundColor: colour }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * A first or last frame, with a menu to change it from another shot's still,
 * clear it, or take it into Quick create.
 */
export function FrameCard({
  label,
  frame,
  choices,
  editable,
  onChange,
  onOpenInCreate,
}: {
  readonly label: string;
  readonly frame: FrameRef | null;
  readonly choices: readonly FrameRef[];
  readonly editable: boolean;
  readonly onChange: (frame: FrameRef | null) => void;
  readonly onOpenInCreate: (frame: FrameRef) => void;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-sm bg-card p-1">
      <div className="flex items-center gap-1">
        {frame ? (
          <ArtThumb art={frame.art} />
        ) : (
          <span className="block h-12.5 w-20 shrink-0 rounded-xs bg-muted" />
        )}
        <span className="flex min-w-0 flex-col ps-1">
          <span className="text-xs font-medium">{label}</span>
          <span className="truncate text-xs text-muted-foreground">
            {frame ? frame.label : "None set"}
          </span>
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="self-start">
            Change <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
          <DropdownMenuLabel>Use a still as the {label.toLowerCase()}</DropdownMenuLabel>
          {choices.length === 0 ? (
            <DropdownMenuItem disabled>No stills yet</DropdownMenuItem>
          ) : (
            choices.map((choice) => (
              <DropdownMenuItem
                key={choice.id}
                disabled={!editable}
                onSelect={() => {
                  onChange(choice);
                }}
              >
                <ArtThumb art={choice.art} className="h-6 w-10" />
                {choice.label}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!editable || frame === null}
            onSelect={() => {
              onChange(null);
            }}
          >
            Clear the {label.toLowerCase()}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={frame === null}
            onSelect={() => {
              if (frame) onOpenInCreate(frame);
            }}
          >
            Use in Quick create
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Trim the shot. The draft is local until applied. */
export function TrimControl({
  durationSec,
  editable,
  onTrim,
}: {
  readonly durationSec: number;
  readonly editable: boolean;
  readonly onTrim: (durationSec: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const value = draft ?? durationSec;
  const changed = draft !== null && draft !== durationSec;

  return (
    <div className="flex flex-col gap-1 rounded-sm bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">Length</span>
        <span className="tabular text-xs text-muted-foreground">{value.toFixed(1)} s</span>
      </div>
      <Slider
        aria-label="Shot length in seconds"
        min={MIN_SHOT_SEC}
        max={MAX_SHOT_SEC}
        step={0.5}
        disabled={!editable}
        value={[value]}
        onValueChange={([next]) => {
          if (next !== undefined) setDraft(next);
        }}
      />
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={!changed}
          onClick={() => {
            setDraft(null);
          }}
        >
          Reset
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!editable || !changed}
          onClick={() => {
            onTrim(value);
            setDraft(null);
          }}
        >
          <Scissors aria-hidden="true" /> Trim to {value.toFixed(1)} s
        </Button>
      </div>
    </div>
  );
}

/**
 * Edit a shot's prompt, with Magic Prompt one press away. Saving changes the
 * prompt only; the next regenerate uses it, and older takes keep theirs.
 */
export function EditPromptDialog({
  open,
  onOpenChange,
  shotNumber,
  prompt,
  characterIds,
  onSave,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly shotNumber: number;
  readonly prompt: string;
  readonly characterIds: readonly string[];
  readonly onSave: (prompt: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EditPromptBody
          shotNumber={shotNumber}
          prompt={prompt}
          characterIds={characterIds}
          onSave={(next) => {
            onSave(next);
            onOpenChange(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function EditPromptBody({
  shotNumber,
  prompt,
  characterIds,
  onSave,
}: {
  readonly shotNumber: number;
  readonly prompt: string;
  readonly characterIds: readonly string[];
  readonly onSave: (prompt: string) => void;
}) {
  const fieldId = useId();
  const [draft, setDraft] = useState(prompt);
  const [magicFor, setMagicFor] = useState<string | null>(null);
  const trimmed = draft.trim();

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Edit the prompt for shot {shotNumber}</DialogTitle>
        <DialogDescription>
          The next take uses this prompt. Older takes keep the prompt they were made with.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId}>Prompt</Label>
        <Textarea
          id={fieldId}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
        <div>
          <MagicPromptButton
            disabled={trimmed === ""}
            pressed={magicFor !== null}
            onClick={() => {
              setMagicFor(magicFor === null ? trimmed : null);
            }}
          />
        </div>
        {magicFor === null ? null : (
          <MagicPrompt
            original={magicFor}
            characterIds={characterIds}
            onUse={setDraft}
            onClose={() => {
              setMagicFor(null);
            }}
          />
        )}
      </div>
      <DialogFooter>
        <Button
          disabled={trimmed === "" || trimmed === prompt.trim()}
          onClick={() => {
            onSave(trimmed);
          }}
        >
          Save prompt
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * Continuity suggestions for a shot. They suggest and never block: the shot
 * can still be regenerated as it is.
 */
export function ContinuityNotes({
  notes,
  editable,
  onApply,
}: {
  readonly notes: readonly ContinuityNote[];
  readonly editable: boolean;
  readonly onApply: (note: ContinuityNote) => void;
}) {
  if (notes.length === 0) {
    return (
      <p className="rounded-sm bg-card p-3 text-xs text-muted-foreground">
        No continuity issues with the shot before this one.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {notes.map((note) => (
        <li key={note.id} className="flex flex-col gap-2 rounded-sm bg-card p-3">
          <p className="flex items-start gap-2 text-sm">
            <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <Badge className="me-1">Suggestion</Badge>
              {note.message}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Suggested prompt: {note.suggestedPrompt}</p>
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            disabled={!editable}
            onClick={() => {
              onApply(note);
            }}
          >
            <Sparkles aria-hidden="true" /> Use the suggestion
          </Button>
        </li>
      ))}
    </ul>
  );
}
