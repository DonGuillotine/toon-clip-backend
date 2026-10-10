"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Crop, ImagePlus, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { charactersQuery } from "@/features/characters/queries";
import { type AspectRatio } from "@/features/storyboards/schema";
import { characterFrameUrl } from "@/lib/art-svg";

import { needsCrop } from "../capabilities";
import { FilePickButton } from "./file-pick-button";

export type Frame = {
  readonly name: string;
  /** A client-side object URL (CONTRACT: uploads are not sent yet). */
  readonly url: string;
};

/*
 * A slot also takes a frame sent from the board (Use as first or last frame)
 * or a still from a timeline shot; both arrive through `useFrameHandoff`.
 * A character sheet image is picked here.
 */

export type FrameSlot = "first" | "last";

const SLOT_LABEL = { first: "First frame", last: "Last frame" } satisfies Record<FrameSlot, string>;

/**
 * Frame mode (spec 7.2): first and last frame slots, swap and clear. The last
 * slot is disabled when the model cannot end on a frame. A frame whose shape
 * differs from the output shows the crop it will get.
 */
export function FrameSlots({
  frames,
  aspectRatio,
  lastFrameSupported,
  modelName,
  onSet,
  onPick,
  onClear,
  onSwap,
}: {
  readonly frames: { readonly first: Frame | null; readonly last: Frame | null };
  readonly aspectRatio: AspectRatio;
  readonly lastFrameSupported: boolean;
  readonly modelName: string;
  readonly onSet: (slot: FrameSlot, file: File) => void;
  readonly onPick: (slot: FrameSlot, frame: Frame) => void;
  readonly onClear: (slot: FrameSlot) => void;
  readonly onSwap: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-1 items-start gap-1 sm:grid-cols-[1fr_auto_1fr]">
        <Slot
          slot="first"
          frame={frames.first}
          aspectRatio={aspectRatio}
          disabled={false}
          onSet={onSet}
          onPick={onPick}
          onClear={onClear}
        />
        <Button
          variant="ghost"
          size="icon"
          className="self-center justify-self-center"
          aria-label="Swap first and last frames"
          disabled={frames.first === null && frames.last === null}
          onClick={onSwap}
        >
          <ArrowLeftRight aria-hidden="true" />
        </Button>
        <Slot
          slot="last"
          frame={frames.last}
          aspectRatio={aspectRatio}
          disabled={!lastFrameSupported}
          onSet={onSet}
          onPick={onPick}
          onClear={onClear}
        />
      </div>
      <p className="px-2 py-1 text-xs text-muted-foreground">
        {lastFrameSupported
          ? "Fill either slot or both. With both, describe the motion between them."
          : `${modelName} cannot end on a last frame. Start from a first frame, or pick another model.`}
      </p>
    </div>
  );
}

function Slot({
  slot,
  frame,
  aspectRatio,
  disabled,
  onSet,
  onPick,
  onClear,
}: {
  readonly slot: FrameSlot;
  readonly frame: Frame | null;
  readonly aspectRatio: AspectRatio;
  readonly disabled: boolean;
  readonly onSet: (slot: FrameSlot, file: File) => void;
  readonly onPick: (slot: FrameSlot, frame: Frame) => void;
  readonly onClear: (slot: FrameSlot) => void;
}) {
  const [size, setSize] = useState<{
    readonly url: string;
    readonly w: number;
    readonly h: number;
  } | null>(null);
  const label = SLOT_LABEL[slot];
  const measured = frame !== null && size?.url === frame.url ? size : null;
  const cropped = measured !== null && needsCrop(measured.w, measured.h, aspectRatio);

  return (
    <div className="flex flex-col gap-1 rounded-sm bg-card p-1">
      <div className="flex items-center justify-between gap-1 ps-2">
        <h3 className="text-xs font-medium">{label}</h3>
        {frame === null ? null : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              onClear(slot);
            }}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
      {frame === null ? (
        <>
          <FilePickButton
            accept="image/*"
            multiple={false}
            disabled={disabled}
            label={`Add ${label.toLowerCase()}`}
            onFiles={(files) => {
              const file = files[0];
              if (file) onSet(slot, file);
            }}
            className="h-auto flex-col gap-1 rounded-xs bg-muted py-6 hover:bg-muted"
          >
            <ImagePlus aria-hidden="true" />
            <span className="text-xs">
              {disabled ? "Not supported by this model" : "Add image"}
            </span>
          </FilePickButton>
          {disabled ? null : (
            <CharacterSheetPicker
              label={label}
              onPick={(picked) => {
                onPick(slot, picked);
              }}
            />
          )}
        </>
      ) : (
        <>
          {/* The box takes the output shape, so what shows is what is kept. */}
          <div
            className="relative overflow-hidden rounded-xs bg-muted"
            style={{ aspectRatio: aspectRatio.replace(":", " / ") }}
          >
            <Image
              src={frame.url}
              alt={`${label}: ${frame.name}`}
              fill
              unoptimized
              className="object-cover"
              onLoad={(event) => {
                const image = event.currentTarget;
                setSize({ url: frame.url, w: image.naturalWidth, h: image.naturalHeight });
              }}
            />
          </div>
          {cropped ? (
            <p className="flex items-start gap-1.5 px-2 text-xs text-muted-foreground">
              <Crop aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              This image is a different shape from {aspectRatio}. The preview shows the crop it will
              get.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Use a character sheet image as the frame. */
function CharacterSheetPicker({
  label,
  onPick,
}: {
  readonly label: string;
  readonly onPick: (frame: Frame) => void;
}) {
  const characters = useQuery(charactersQuery);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="self-start">
          <UserRound aria-hidden="true" /> From a character sheet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Use as {label.toLowerCase()}</DropdownMenuLabel>
        {characters.isPending ? (
          <DropdownMenuItem disabled>Loading your cast</DropdownMenuItem>
        ) : characters.isError ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              void characters.refetch();
            }}
          >
            The cast did not load. Try again
          </DropdownMenuItem>
        ) : characters.data.length === 0 ? (
          <DropdownMenuItem disabled>No character sheets yet</DropdownMenuItem>
        ) : (
          characters.data.map((character) => (
            <DropdownMenuItem
              key={character.id}
              onSelect={() => {
                onPick({
                  name: `${character.name} character sheet`,
                  url: characterFrameUrl(character.id),
                });
              }}
            >
              {character.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
