"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { charactersQuery } from "../queries";
import { type CharacterSummary } from "../schema";

const GRID = "grid grid-cols-1 gap-0.5 sm:grid-cols-2";

export function Cast() {
  const { data, isPending, isError, refetch } = useQuery(charactersQuery);

  return (
    <Section
      title="Your cast"
      titleId="cast-heading"
      count={data ? data.length : null}
      className="h-full"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            toast("The character sheet editor is not built yet.");
          }}
        >
          <Plus aria-hidden="true" /> New character
        </Button>
      }
    >
      {isPending ? (
        <div className={GRID}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={`slot-${String(index)}`} className="h-20 rounded-sm" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 p-3">
          <p className="text-sm font-medium">Your characters did not load.</p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">
          Add a character sheet so every shot keeps the same face, outfit and colours.
        </p>
      ) : (
        <ul className={GRID}>
          {data.map((character) => (
            <li key={character.id}>
              <CharacterRow character={character} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** A row in the well: rests on L1, lifts to L2 on hover. */
function CharacterRow({ character }: { readonly character: CharacterSummary }) {
  return (
    <div className="flex h-full gap-3 rounded-sm p-3 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card">
      <Portrait character={character} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{character.name}</p>
          {character.isSample ? <Badge>Sample</Badge> : null}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{character.look}</p>
        <p className="tabular mt-auto text-xs text-muted-foreground">
          {character.outfitCount} {character.outfitCount === 1 ? "outfit" : "outfits"} ·{" "}
          {character.expressionCount} expressions
        </p>
      </div>
    </div>
  );
}

/**
 * Until sheets have turnaround art, a character is their palette in a
 * screentoned roundel: comic art standing in for the character's real face.
 */
function Portrait({ character }: { readonly character: CharacterSummary }) {
  const stops = character.palette
    .map((colour, index, all) => {
      const from = (index / all.length) * 360;
      const to = ((index + 1) / all.length) * 360;
      return `${colour} ${String(from)}deg ${String(to)}deg`;
    })
    .join(", ");

  return (
    <div
      aria-hidden="true"
      className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full"
      style={{ backgroundImage: `conic-gradient(from 200deg, ${stops})` }}
    >
      <div className="absolute inset-0 tone-dots [--tone-ink:var(--comic-faint)] [--tone-size:4px]" />
      <span className="relative grid size-7 place-items-center rounded-full bg-card text-xs font-semibold">
        {character.name.charAt(0)}
      </span>
    </div>
  );
}
