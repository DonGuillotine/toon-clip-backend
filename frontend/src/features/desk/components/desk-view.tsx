"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode } from "react";

import { CoverArt } from "@/components/comic/cover-art";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Portrait } from "@/features/characters/components/portrait";
import { charactersQuery } from "@/features/characters/queries";
import { activeJobsQuery } from "@/features/jobs/queries";
import { type Job } from "@/features/jobs/schema";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { useHydrated } from "@/lib/use-hydrated";

import { deskLibraryQuery } from "../queries";
import { type DeskLibrary } from "../schema";

import { PaletteDialog } from "./palette-dialog";
import { StyleDialog } from "./style-dialog";

/** The dialog value for a palette or style that does not exist yet. */
const NEW = "new";

/**
 * Renders a section body for one query: a skeleton while it loads, the
 * designed error with a retry, or the content. Characters and jobs are also
 * read by the dock, so the body waits for hydration (AGENTS.md §3).
 */
function QueryBody<T>({
  query,
  noun,
  children,
}: {
  readonly query: UseQueryResult<T>;
  readonly noun: string;
  readonly children: (data: T) => ReactNode;
}) {
  const hydrated = useHydrated();
  if (!hydrated || query.isPending) {
    return (
      <div className="flex flex-col gap-1" aria-busy="true">
        <Skeleton className="h-14 rounded-sm" />
        <Skeleton className="h-14 rounded-sm" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="text-sm">{noun} did not load.</p>
        <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return children(query.data);
}

function EmptyRow({ children }: { readonly children: ReactNode }) {
  return <p className="p-3 text-sm text-muted-foreground">{children}</p>;
}

export function DeskView() {
  const characters = useQuery(charactersQuery);
  const jobs = useQuery(activeJobsQuery);
  const library = useQuery(deskLibraryQuery);
  // The open editor lives in the URL, so a link reopens it.
  const [paletteParam, setPaletteParam] = useQueryState("palette", parseAsString);
  const [styleParam, setStyleParam] = useQueryState("style", parseAsString);
  const editingPalette =
    library.data?.palettes.find((palette) => palette.id === paletteParam) ?? null;
  const editingStyle = library.data?.styles.find((style) => style.id === styleParam) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12">
      <Section
        title="Characters"
        titleId="desk-characters"
        count={characters.data?.length ?? null}
        className="lg:col-span-6"
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/characters/new">
              <Plus aria-hidden="true" /> New character
            </Link>
          </Button>
        }
      >
        <QueryBody query={characters} noun="Characters">
          {(data) =>
            data.length === 0 ? (
              <EmptyRow>
                Your cast lives here. Add a character sheet to keep them on model.
              </EmptyRow>
            ) : (
              <ul className="flex flex-col gap-1">
                {data.map((character) => (
                  <li key={character.id}>
                    <Link
                      href={`/characters/${character.id}`}
                      className="flex items-center gap-3 rounded-sm px-3 py-2 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
                    >
                      <Portrait character={character} size="sm" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {character.name}
                          {character.isSample ? <Badge>Sample</Badge> : null}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {character.look}
                        </span>
                      </div>
                      <span className="tabular shrink-0 text-xs text-muted-foreground">
                        {character.outfitCount} outfits, {character.expressionCount} expressions
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBody>
      </Section>

      <Section
        title="Pending tasks"
        titleId="desk-tasks"
        count={jobs.data?.length ?? null}
        className="lg:col-span-6"
      >
        <QueryBody query={jobs} noun="Pending tasks">
          {(data) =>
            data.length === 0 ? (
              <EmptyRow>
                Nothing is generating. Start a storyboard and its shots queue here.
              </EmptyRow>
            ) : (
              <ul className="flex flex-col gap-1" aria-live="polite">
                {data.map((job) => (
                  <li key={job.id}>
                    <TaskRow job={job} />
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBody>
      </Section>

      <Section
        title="Palettes"
        titleId="desk-palettes"
        count={library.data?.palettes.length ?? null}
        className="lg:col-span-6"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void setPaletteParam(NEW);
            }}
          >
            <Plus aria-hidden="true" /> New palette
          </Button>
        }
      >
        <QueryBody query={library} noun="Palettes">
          {(data) =>
            data.palettes.length === 0 ? (
              <EmptyRow>Named colour sets go here, ready to restyle any shot.</EmptyRow>
            ) : (
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {data.palettes.map((palette) => (
                  <li key={palette.id}>
                    <Button
                      variant="ghost"
                      aria-label={`Edit palette ${palette.name}`}
                      className="h-auto w-full flex-col items-stretch gap-1 rounded-sm bg-card p-1 text-start text-foreground hover:bg-card"
                      onClick={() => {
                        void setPaletteParam(palette.id);
                      }}
                    >
                      <span aria-hidden="true" className="flex h-10 overflow-hidden rounded-xs">
                        {palette.swatches.map((swatch, index) => (
                          // The creator's colours, drawn as their own data.
                          <span
                            key={`${swatch.hex}-${String(index)}`}
                            className="flex-1"
                            title={swatch.role}
                            style={{ backgroundColor: swatch.hex }}
                          />
                        ))}
                      </span>
                      <span className="flex items-center justify-between gap-2 px-2 pb-1">
                        <span className="truncate text-sm font-medium">{palette.name}</span>
                        <Pencil aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBody>
      </Section>

      <Section
        title="Style presets"
        titleId="desk-styles"
        count={library.data?.styles.length ?? null}
        className="lg:col-span-6"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void setStyleParam(NEW);
            }}
          >
            <Plus aria-hidden="true" /> New style
          </Button>
        }
      >
        <QueryBody query={library} noun="Style presets">
          {(data) =>
            data.styles.length === 0 ? (
              <EmptyRow>Named looks go here, so every storyboard starts on style.</EmptyRow>
            ) : (
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {data.styles.map((style) => (
                  <li key={style.id}>
                    <Button
                      variant="ghost"
                      aria-label={`Edit style ${style.name}`}
                      className="h-auto w-full flex-col items-stretch gap-1 rounded-sm bg-card p-1 text-start whitespace-normal text-foreground hover:bg-card"
                      onClick={() => {
                        void setStyleParam(style.id);
                      }}
                    >
                      <div className="h-25 overflow-hidden rounded-xs">
                        <CoverArt
                          art={style.art}
                          sfx={null}
                          className="h-50 w-80 origin-top-left scale-50"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 px-1 pb-1">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {style.name}
                          {style.isDefault ? <Badge>Default</Badge> : null}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {style.description}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {recipeLabel(data.recipes, style.recipeId)}
                        </span>
                      </div>
                    </Button>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBody>
      </Section>

      <PaletteDialog
        palette={editingPalette}
        open={paletteParam === NEW || editingPalette !== null}
        onOpenChange={(open) => {
          if (!open) void setPaletteParam(null);
        }}
      />
      <StyleDialog
        style={editingStyle}
        recipes={library.data?.recipes ?? []}
        open={styleParam === NEW || editingStyle !== null}
        onOpenChange={(open) => {
          if (!open) void setStyleParam(null);
        }}
      />
    </div>
  );
}

function recipeLabel(recipes: DeskLibrary["recipes"], recipeId: string | null): string {
  if (recipeId === null) return "No linked recipe";
  const recipe = recipes.find((candidate) => candidate.id === recipeId);
  return recipe ? `Recipe: ${recipe.name} v${String(recipe.version)}` : "Linked recipe removed";
}

function TaskRow({ job }: { readonly job: Job }) {
  const meta = SHOT_STATE_META[job.status];
  const Icon = meta.icon;
  const detail = (() => {
    switch (job.status) {
      case "queued":
        return `Number ${String(job.positionInQueue)} in the queue`;
      case "generating":
        return job.secondsLeft === null
          ? `${String(job.progress)}% done`
          : `${String(job.progress)}% done, about ${String(job.secondsLeft)}s left`;
      case "failed":
        return `${job.reason}. ${String(job.creditsRefunded)} credits refunded.`;
    }
  })();
  return (
    <Link
      href={`/storyboards/${job.storyboardId}`}
      className="flex items-center gap-3 rounded-sm px-3 py-2 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
    >
      <Icon aria-hidden="true" className={`size-4 shrink-0 ${meta.tone}`} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {job.storyboardTitle}, shot {job.shotNumber}, take {job.takeNumber}
        </span>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </div>
      <span className={`shrink-0 text-xs font-medium ${meta.tone}`}>{meta.label}</span>
    </Link>
  );
}
