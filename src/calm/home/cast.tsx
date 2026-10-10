"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/calm/badge";
import { Button } from "@/components/ui/calm/button";
import { Skeleton } from "@/components/ui/calm/skeleton";

import { charactersQuery } from "@/features/characters/queries";
import { type CharacterSummary } from "@/features/characters/schema";

import { Card, CardHeader } from "../card";

export function CalmCast() {
  const { data, isPending, isError, refetch } = useQuery(charactersQuery);

  return (
    <Card aria-labelledby="cast-heading" className="flex flex-col">
      <CardHeader className="border-b border-line">
        <h2 id="cast-heading" className="text-base font-semibold">
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
      </CardHeader>

      {isPending ? (
        <div className="grid grid-cols-2 gap-3 p-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
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
        <ul className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
          {data.map((character) => (
            <li key={character.id}>
              <CharacterCard character={character} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CharacterCard({ character }: { readonly character: CharacterSummary }) {
  return (
    <div className="flex h-full gap-2.5 rounded-lg p-2.5 transition-colors duration-(--duration-fast) ease-out hover:bg-tone-1">
      <Portrait character={character} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{character.name}</p>
          {character.isSample ? <Badge>Sample</Badge> : null}
        </div>
        <p className="line-clamp-2 text-xs text-ink-soft">{character.look}</p>
        <p className="tabular mt-auto text-xs text-ink-soft">
          {character.outfitCount} {character.outfitCount === 1 ? "outfit" : "outfits"} ·{" "}
          {character.expressionCount} expressions
        </p>
      </div>
    </div>
  );
}

/**
 * Until sheets have turnaround art, a character is their palette in a
 * screentoned roundel: a small comic touch on otherwise plain rows.
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
      className="ring-ink-faint relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full ring-1"
      style={{ backgroundImage: `conic-gradient(from 200deg, ${stops})` }}
    >
      <div className="absolute inset-0 tone-dots [--tone-ink:var(--ink-faint)] [--tone-size:4px]" />
      <span className="relative grid size-7 place-items-center rounded-full bg-sheet text-xs font-semibold shadow-card">
        {character.name.charAt(0)}
      </span>
    </div>
  );
}
