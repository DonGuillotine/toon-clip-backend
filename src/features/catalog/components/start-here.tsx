"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { characterFor, tourScenario } from "../choices";
import { catalogQuery } from "../queries";
import { CharacterArt } from "./character-art";

/**
 * The tour's way in, on home: the example the tour walks through, with its
 * character art from the API and one button. Nothing here is sample art: if
 * the catalogue has no example, the card says so.
 */
export function StartHere() {
  const catalog = useQuery(catalogQuery);
  const scenario = catalog.data === undefined ? null : tourScenario(catalog.data.scenarios.items);
  const character =
    scenario === null ? null : characterFor(scenario, scenario.selections[0] ?? null);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-pop">
      <div className="relative">
        {catalog.isPending ? (
          <Skeleton className="aspect-video w-full rounded-none" />
        ) : (
          <CharacterArt
            name={character?.name ?? "Toon Clip"}
            imageUrl={character?.imageUrl ?? null}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="aspect-video w-full"
          />
        )}
        <div className="absolute inset-0 grid place-items-center bg-canvas/30">
          <Button asChild size="lg" variant="default">
            <Link href="/tour">
              Start the demo <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t-2 border-border px-4 py-3 font-label text-xs tracking-label">
        <span className="truncate">
          {catalog.isError
            ? "Examples did not load"
            : scenario === null
              ? catalog.isPending
                ? "Loading the example"
                : "No example published yet"
              : scenario.title}
        </span>
        <span className="shrink-0 text-muted-foreground">3 steps</span>
      </div>
    </div>
  );
}
