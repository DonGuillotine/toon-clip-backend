"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/manga/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { charactersQuery } from "../queries";
import { type CharacterSummary } from "../schema";

export function Cast() {
  const { data, isPending, isError, refetch } = useQuery(charactersQuery);

  return (
    <Panel aria-labelledby="cast-heading" className="flex flex-col">
      <header className="flex items-center justify-between gap-3 border-b-3 border-ink px-4 py-3">
        <h2 id="cast-heading" className="font-display text-xl">
          Your cast
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast("The character sheet editor is not built yet.");
          }}
        >
          <Plus aria-hidden="true" /> New character
        </Button>
      </header>

      {isPending ? (
        <div className="grid grid-cols-2 gap-3 p-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 p-4">
          <p className="font-bold">Your characters did not load.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <p className="p-4 text-ink-soft">
          Add a character sheet so every shot keeps the same face, outfit and colours.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {data.map((character) => (
            <li key={character.id}>
              <CharacterCard character={character} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CharacterCard({ character }: { readonly character: CharacterSummary }) {
  return (
    <div className="flex h-full gap-3 rounded-md border-2 border-ink p-3">
      <Portrait character={character} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-base">{character.name}</p>
          {character.isSample ? <Badge variant="quiet">Sample</Badge> : null}
        </div>
        <p className="line-clamp-2 text-xs text-ink-soft">{character.look}</p>
        <p className="mt-auto text-xs text-ink-soft tabular">
          {character.outfitCount} {character.outfitCount === 1 ? "outfit" : "outfits"} ·{" "}
          {character.expressionCount} expressions
        </p>
      </div>
    </div>
  );
}

/**
 * Until sheets have turnaround art, a character is shown as their palette
 * in a screentoned roundel with their initial.
 */
function Portrait({ character }: { readonly character: CharacterSummary }) {
  const stops = character.palette
    .map((colour, index, all) => {
      const from = (index / all.length) * 360;
      const to = ((index + 1) / all.length) * 360;
      return `${colour} ${from}deg ${to}deg`;
    })
    .join(", ");

  return (
    <div
      aria-hidden="true"
      className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink"
      style={{ backgroundImage: `conic-gradient(from 200deg, ${stops})` }}
    >
      <div className="tone-dots absolute inset-0 [--tone-ink:var(--ink-faint)] [--tone-size:4px]" />
      <span className="relative grid size-8 place-items-center rounded-full border-2 border-ink bg-sheet font-display text-sm">
        {character.name.charAt(0)}
      </span>
    </div>
  );
}
