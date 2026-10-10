"use client";

import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Portrait } from "@/features/characters/components/portrait";
import { SheetImageView } from "@/features/characters/components/sheet-image-view";
import { characterQuery, charactersQuery } from "@/features/characters/queries";
import { SHEET_SET_META, sheetImages, sheetImageUrl } from "@/features/characters/sheet";
import { cn } from "@/lib/utils";

import { type Frame } from "./frame-slots";

/**
 * Fill a frame slot from a character sheet (spec 7.2): pick a character, then
 * one of their turnarounds, expressions or outfits. The sheet stays the
 * source of truth; the slot only references its image.
 */
export function CharacterFramePicker({
  slotLabel,
  disabled,
  onPick,
}: {
  readonly slotLabel: string;
  readonly disabled: boolean;
  readonly onPick: (frame: Frame) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled} className="self-center">
          <UserRound aria-hidden="true" /> From character sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{slotLabel} from a character sheet</DialogTitle>
          <DialogDescription>
            Start or end the clip on a drawing the character is already on model in.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <PickerBody
            onPick={(frame) => {
              onPick(frame);
              setOpen(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({ onPick }: { readonly onPick: (frame: Frame) => void }) {
  const cast = useQuery(charactersQuery);
  const [chosen, setChosen] = useState<string | null>(null);
  const selectedId = chosen ?? cast.data?.[0]?.id ?? null;

  if (cast.isPending) return <Skeleton className="h-40 rounded-md" />;
  if (cast.isError) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md bg-muted p-3">
        <p>Your cast did not load.</p>
        <Button size="sm" variant="secondary" onClick={() => void cast.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (cast.data.length === 0 || selectedId === null) {
    return (
      <p className="rounded-md bg-muted p-3 text-muted-foreground">
        No characters yet. Add a character sheet from the desk first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-1" aria-label="Characters">
        {cast.data.map((character) => (
          <li key={character.id}>
            <Button
              variant="ghost"
              aria-pressed={character.id === selectedId}
              className={cn(
                "h-11 gap-1.5 ps-1.5 pe-4",
                character.id === selectedId &&
                  "bg-primary text-primary-foreground hover:bg-primary",
              )}
              onClick={() => {
                setChosen(character.id);
              }}
            >
              <Portrait character={character} size="sm" />
              {character.name}
            </Button>
          </li>
        ))}
      </ul>
      <SheetImages id={selectedId} onPick={onPick} />
    </div>
  );
}

function SheetImages({
  id,
  onPick,
}: {
  readonly id: string;
  readonly onPick: (frame: Frame) => void;
}) {
  const sheet = useQuery(characterQuery(id));

  if (sheet.isPending) return <Skeleton className="h-40 rounded-md" />;
  if (sheet.isError) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md bg-muted p-3">
        <p>That sheet did not load.</p>
        <Button size="sm" variant="secondary" onClick={() => void sheet.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  const images = sheetImages(sheet.data);
  if (images.length === 0) {
    return (
      <p className="rounded-md bg-muted p-3 text-muted-foreground">
        {sheet.data.name}&apos;s sheet has no images yet.
      </p>
    );
  }

  return (
    <ul className="grid max-h-96 grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-1 overflow-y-auto rounded-md bg-muted p-1">
      {images.map(({ set, image }) => (
        <li key={image.id}>
          <Button
            variant="ghost"
            className="h-auto w-full flex-col items-stretch gap-1 rounded-sm bg-card p-1 text-start text-foreground hover:bg-card"
            onClick={() => {
              onPick({
                name: `${sheet.data.name}, ${image.label}`,
                url: sheetImageUrl(sheet.data, image),
              });
            }}
          >
            <SheetImageView image={image} className="w-full" />
            <span className="flex flex-col px-1 pb-1">
              <span className="truncate text-xs font-medium">{image.label}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {SHEET_SET_META[set].title}
              </span>
            </span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
