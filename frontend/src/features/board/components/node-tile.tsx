"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2, Play } from "lucide-react";
import { type FocusEvent, type MouseEvent } from "react";

import { CoverArt } from "@/components/comic/cover-art";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Portrait } from "@/features/characters/components/portrait";
import { charactersQuery } from "@/features/characters/queries";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

import { type BoardNode } from "../schema";

const KIND_LABEL = {
  image: "Image",
  video: "Video",
  text: "Note",
  palette: "Palette",
  character: "Character",
} satisfies Record<BoardNode["kind"], string>;

/**
 * One tile on the board. A toggle, because a tile's one interaction is being
 * selected: `aria-pressed` carries the selection to assistive tech. Selection
 * shows as the highlighter rim (DESIGN.md §4, `spot` is selection).
 */
export function NodeTile({
  node,
  selected,
  interactive,
  onSelect,
  onFocus,
}: {
  readonly node: BoardNode;
  readonly selected: boolean;
  readonly interactive: boolean;
  readonly onSelect: (id: string, additive: boolean) => void;
  readonly onFocus: (event: FocusEvent<HTMLButtonElement>) => void;
}) {
  const name = `${KIND_LABEL[node.kind]}: ${node.label}`;
  return (
    <Toggle
      pressed={selected}
      aria-label={node.usedInTimeline ? `${name}, used in the timeline` : name}
      tabIndex={interactive ? 0 : -1}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onSelect(node.id, event.shiftKey || event.metaKey || event.ctrlKey);
      }}
      onFocus={onFocus}
      className={cn(
        "flex size-full flex-col items-stretch justify-start gap-1 rounded-sm bg-card p-1 text-start whitespace-normal",
        "hover:bg-card data-[state=on]:bg-spot data-[state=on]:hover:bg-spot-hover",
      )}
    >
      <div className="relative h-25 w-40 overflow-hidden rounded-xs bg-muted">
        <NodeBody node={node} />
        <div className="absolute inset-x-1 top-1 flex items-start justify-between gap-1">
          <StateBadge node={node} />
          {node.usedInTimeline ? (
            <Badge variant="overlay" className="ms-auto">
              <Link2 aria-hidden="true" /> Timeline
            </Badge>
          ) : null}
        </div>
        {node.kind === "video" ? (
          <Badge variant="overlay" className="tabular absolute start-1 bottom-1">
            <Play aria-hidden="true" /> {formatDuration(node.durationSec)}
          </Badge>
        ) : null}
      </div>
      <span className="truncate px-1 text-xs font-medium">{node.label}</span>
    </Toggle>
  );
}

function StateBadge({ node }: { readonly node: BoardNode }) {
  if (node.kind !== "image" && node.kind !== "video") return null;
  if (node.state === "ready") return null;
  const meta = SHOT_STATE_META[node.state];
  const Icon = meta.icon;
  return (
    <Badge variant="overlay" className={meta.tone}>
      <Icon aria-hidden="true" /> {meta.label}
    </Badge>
  );
}

function NodeBody({ node }: { readonly node: BoardNode }) {
  switch (node.kind) {
    case "image":
    case "video":
      // Cover art is composed at 320 x 200; drawn at that size and halved.
      return <CoverArt art={node.art} sfx={null} className="h-50 w-80 origin-top-left scale-50" />;
    case "text":
      return (
        <p className="line-clamp-5 p-2 pt-2 text-xs leading-snug text-foreground">{node.text}</p>
      );
    case "palette":
      return (
        <div className="flex size-full">
          {node.colours.map((colour) => (
            // A palette swatch is the creator's data, so it is drawn with their colour.
            <div key={colour} className="h-full flex-1" style={{ backgroundColor: colour }} />
          ))}
        </div>
      );
    case "character":
      return <CharacterBody characterId={node.characterId} />;
  }
}

function CharacterBody({ characterId }: { readonly characterId: string }) {
  const characters = useQuery(charactersQuery);
  const character = characters.data?.find((item) => item.id === characterId);
  return (
    <div className="grid size-full place-items-center">
      {character ? (
        <div className="flex flex-col items-center gap-1 p-1">
          <Portrait character={character} />
          <span className="line-clamp-2 text-center text-xs text-muted-foreground">
            {character.look}
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Character sheet not found</span>
      )}
    </div>
  );
}
