"use client";

import { Columns2, SplitSquareHorizontal } from "lucide-react";
import { useState } from "react";

import { CoverArt } from "@/components/comic/cover-art";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCredits } from "@/lib/format";

import { type Take } from "../schema";

type Mode = "side" | "wipe";
const MODES: readonly Mode[] = ["side", "wipe"];

function isMode(value: string): value is Mode {
  return MODES.some((mode) => mode === value);
}

/** The two takes a comparison opens on: the selected one against the newest other. */
export function defaultPair(
  takes: readonly Take[],
  selectedTakeId: string | null,
): readonly [string, string] | null {
  const selected = takes.find((take) => take.id === selectedTakeId) ?? takes.at(-1);
  const other = [...takes].reverse().find((take) => take.id !== selected?.id);
  if (!selected || !other) return null;
  return [selected.id, other.id];
}

/**
 * Compare takes (spec 7.5): side by side, or a wipe where one take is
 * revealed over the other. Either take can be made the selected one from here.
 */
export function CompareTakesDialog({
  open,
  onOpenChange,
  shotNumber,
  takes,
  selectedTakeId,
  locked,
  onSelect,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly shotNumber: number;
  readonly takes: readonly Take[];
  readonly selectedTakeId: string | null;
  readonly locked: boolean;
  readonly onSelect: (takeId: string) => void;
}) {
  const pair = defaultPair(takes, selectedTakeId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && pair ? (
        <CompareBody
          shotNumber={shotNumber}
          takes={takes}
          initial={pair}
          selectedTakeId={selectedTakeId}
          locked={locked}
          onSelect={(id) => {
            onSelect(id);
            onOpenChange(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function CompareBody({
  shotNumber,
  takes,
  initial,
  selectedTakeId,
  locked,
  onSelect,
}: {
  readonly shotNumber: number;
  readonly takes: readonly Take[];
  readonly initial: readonly [string, string];
  readonly selectedTakeId: string | null;
  readonly locked: boolean;
  readonly onSelect: (takeId: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("side");
  const [leftId, setLeftId] = useState(initial[0]);
  const [rightId, setRightId] = useState(initial[1]);
  const [wipe, setWipe] = useState(50);

  const left = takes.find((take) => take.id === leftId);
  const right = takes.find((take) => take.id === rightId);
  if (!left || !right) return null;

  return (
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Compare takes for shot {shotNumber}</DialogTitle>
        <DialogDescription>
          Every take is kept. Pick the one the timeline should use.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          size="sm"
          spacing={1}
          aria-label="Comparison view"
          value={mode}
          onValueChange={(next) => {
            if (isMode(next)) setMode(next);
          }}
        >
          <ToggleGroupItem value="side">
            <Columns2 aria-hidden="true" /> Side by side
          </ToggleGroupItem>
          <ToggleGroupItem value="wipe">
            <SplitSquareHorizontal aria-hidden="true" /> Wipe
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <TakePicker label="Left" takes={takes} value={leftId} onChange={setLeftId} />
        <TakePicker label="Right" takes={takes} value={rightId} onChange={setRightId} />
      </div>

      {mode === "side" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <TakePanel
            take={left}
            selected={left.id === selectedTakeId}
            locked={locked}
            onSelect={onSelect}
          />
          <TakePanel
            take={right}
            selected={right.id === selectedTakeId}
            locked={locked}
            onSelect={onSelect}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            // A wipe is spatial, left take against right take, in any language.
            dir="ltr"
            className="relative aspect-8/5 overflow-hidden rounded-md"
            role="img"
            aria-label={`Take ${String(left.number)} on the left of the wipe, take ${String(right.number)} on the right, split at ${String(wipe)}%`}
          >
            <CoverArt art={right.art} sfx={null} className="absolute inset-0" />
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${String(100 - wipe)}% 0 0)` }}
            >
              <CoverArt art={left.art} sfx={null} className="absolute inset-0" />
            </div>
            <span
              aria-hidden="true"
              className="absolute inset-y-0 w-1 -translate-x-1/2 bg-primary"
              style={{ left: `${String(wipe)}%` }}
            />
            <Badge className="absolute start-2 top-2">Take {left.number}</Badge>
            <Badge className="absolute end-2 top-2">Take {right.number}</Badge>
          </div>
          <Slider
            aria-label="Wipe position"
            min={0}
            max={100}
            step={1}
            value={[wipe]}
            onValueChange={([value]) => {
              if (value !== undefined) setWipe(value);
            }}
          />
          <div className="flex flex-wrap justify-between gap-2">
            <SelectButton
              take={left}
              selectedTakeId={selectedTakeId}
              locked={locked}
              onSelect={onSelect}
            />
            <SelectButton
              take={right}
              selectedTakeId={selectedTakeId}
              locked={locked}
              onSelect={onSelect}
            />
          </div>
        </div>
      )}
      {locked ? (
        <p className="text-xs text-muted-foreground">
          This shot is locked. Unlock it to change the selected take.
        </p>
      ) : null}
    </DialogContent>
  );
}

function TakePicker({
  label,
  takes,
  value,
  onChange,
}: {
  readonly label: string;
  readonly takes: readonly Take[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      spacing={1}
      aria-label={`${label} take`}
      value={value}
      onValueChange={(next) => {
        if (next !== "") onChange(next);
      }}
      className="flex-wrap"
    >
      {takes.map((take) => (
        <ToggleGroupItem key={take.id} value={take.id}>
          Take {take.number}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function SelectButton({
  take,
  selectedTakeId,
  locked,
  onSelect,
}: {
  readonly take: Take;
  readonly selectedTakeId: string | null;
  readonly locked: boolean;
  readonly onSelect: (takeId: string) => void;
}) {
  if (take.id === selectedTakeId) return <Badge variant="spot">Take {take.number} selected</Badge>;
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={locked}
      onClick={() => {
        onSelect(take.id);
      }}
    >
      Use take {take.number}
    </Button>
  );
}

function TakePanel({
  take,
  selected,
  locked,
  onSelect,
}: {
  readonly take: Take;
  readonly selected: boolean;
  readonly locked: boolean;
  readonly onSelect: (takeId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted p-1">
      <div className="aspect-8/5 overflow-hidden rounded-sm">
        <CoverArt art={take.art} sfx={null} className="size-full" />
      </div>
      <div className="flex flex-col gap-1 px-2 pb-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Take {take.number}</span>
          <SelectButton
            take={take}
            selectedTakeId={selected ? take.id : null}
            locked={locked}
            onSelect={onSelect}
          />
        </div>
        <span className="tabular text-muted-foreground">
          {take.settings.model}, {take.settings.resolution}, seed {take.settings.seed},{" "}
          {formatCredits(take.credits)} credits
        </span>
        {take.notes === null ? null : <span>Notes: {take.notes}</span>}
      </div>
    </div>
  );
}
