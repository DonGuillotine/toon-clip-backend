"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { type ReactNode } from "react";
import { toast } from "sonner";

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

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12">
      <Section
        title="Characters"
        titleId="desk-characters"
        count={characters.data?.length ?? null}
        className="lg:col-span-6"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toast("The character sheet editor is not built yet.");
            }}
          >
            New character
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
                  <li key={character.id} className="flex items-center gap-3 rounded-sm px-3 py-2">
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
      >
        <QueryBody query={library} noun="Palettes">
          {(data) =>
            data.palettes.length === 0 ? (
              <EmptyRow>Named colour sets go here, ready to restyle any shot.</EmptyRow>
            ) : (
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {data.palettes.map((palette) => (
                  <li key={palette.id} className="flex flex-col gap-1 rounded-sm bg-card p-1">
                    <div aria-hidden="true" className="flex h-10 overflow-hidden rounded-xs">
                      {palette.colours.map((colour) => (
                        // The creator's colours, drawn as their own data.
                        <div key={colour} className="flex-1" style={{ backgroundColor: colour }} />
                      ))}
                    </div>
                    <span className="px-1 pb-1 text-sm font-medium">{palette.name}</span>
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
      >
        <QueryBody query={library} noun="Style presets">
          {(data) =>
            data.styles.length === 0 ? (
              <EmptyRow>Named looks go here, so every storyboard starts on style.</EmptyRow>
            ) : (
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {data.styles.map((style) => (
                  <li key={style.id} className="flex flex-col gap-1 rounded-sm bg-card p-1">
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
                      <span className="text-xs text-muted-foreground">{style.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBody>
      </Section>
    </div>
  );
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
