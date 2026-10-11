"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { EmptyState, LoadError, UnreadableNote } from "@/components/load-state";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { characterFor } from "../choices";
import { catalogQuery } from "../queries";
import { type Scenario } from "../schema";
import { CharacterArt } from "./character-art";

function ExampleTile({ scenario }: { readonly scenario: Scenario }) {
  const character = characterFor(scenario, scenario.selections[0] ?? null);
  const versions = scenario.selections.length;
  return (
    <li>
      <Link
        href={`/examples/${encodeURIComponent(scenario.id)}`}
        className="group flex h-full flex-col gap-1 rounded-sm p-1 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
      >
        <span className="relative block">
          <CharacterArt
            name={character?.name ?? scenario.title}
            imageUrl={character?.imageUrl ?? null}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="aspect-8/5 rounded-xs"
          />
          {scenario.isTour ? (
            <Badge variant="overlay" className="absolute start-2 top-2">
              Free tour
            </Badge>
          ) : null}
        </span>
        <span className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
          <span className="truncate text-sm font-medium">{scenario.title}</span>
          <span className="line-clamp-2 text-xs text-muted-foreground">{scenario.description}</span>
          <span className="tabular text-xs text-muted-foreground">
            {character === null ? null : `${character.name} · `}
            {versions === 1 ? "1 version" : `${String(versions)} versions`}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** The published examples. Each one opens its create page. */
export function ExamplesSection() {
  const catalog = useQuery(catalogQuery);
  const scenarios = catalog.data?.scenarios.items ?? null;

  return (
    <Section
      title="Examples"
      titleId="examples-heading"
      description="Prepared characters and ideas, ready to direct."
      count={scenarios === null ? null : scenarios.length}
    >
      {catalog.isPending ? (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <li key={index}>
              <Skeleton className="aspect-4/3 rounded-sm" />
            </li>
          ))}
        </ul>
      ) : catalog.isError ? (
        <LoadError onRetry={() => void catalog.refetch()}>Examples did not load.</LoadError>
      ) : (
        <>
          {catalog.data.scenarios.items.length === 0 ? (
            <EmptyState>
              No examples are published yet. When the studio publishes one, it shows up here.
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.data.scenarios.items.map((scenario) => (
                <ExampleTile key={scenario.id} scenario={scenario} />
              ))}
            </ul>
          )}
          <UnreadableNote
            count={catalog.data.scenarios.unreadable}
            singular="example"
            plural="examples"
          />
        </>
      )}
    </Section>
  );
}
