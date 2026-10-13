"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { CoverArt } from "@/components/comic/cover-art";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/lib/use-hydrated";

import { LAYOUTS } from "../layouts";
import { comicListQuery } from "../queries";
import { type ComicSummary } from "../schema";
import { LayoutDiagram } from "./layout-diagram";
import { NewPageDialog } from "./new-page-dialog";

function Tile({ page, hydrated }: { readonly page: ComicSummary; readonly hydrated: boolean }) {
  const missing = page.panelCount - page.readyCount;
  return (
    <li>
      <Link
        href={`/comics/${page.id}`}
        className="group flex flex-col gap-1 rounded-sm p-1 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
      >
        <span className="relative flex aspect-8/5 overflow-hidden rounded-xs bg-card">
          {page.cover === null ? (
            <span className="flex flex-1 items-center justify-center p-4">
              <LayoutDiagram layout={page.layout} className="h-full" />
            </span>
          ) : (
            <>
              <CoverArt art={page.cover} sfx={null} className="absolute inset-0" />
              <Badge variant="overlay" className="absolute start-2 top-2">
                Sample art
              </Badge>
            </>
          )}
        </span>
        <span className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
          <span className="truncate text-sm font-medium">{page.title}</span>
          <span className="tabular text-xs text-muted-foreground">
            {LAYOUTS[page.layout].label} · {page.panelCount}{" "}
            {page.panelCount === 1 ? "panel" : "panels"}
            {hydrated
              ? ` · ${formatDistanceToNowStrict(new Date(page.updatedAt), { addSuffix: true })}`
              : null}
          </span>
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{missing === 0 ? "Every panel drawn" : `${String(missing)} to draw`}</span>
            <span className="flex items-center gap-1">
              <MessageSquare aria-hidden="true" className="size-3.5" />
              {page.bubbleCount} {page.bubbleCount === 1 ? "bubble" : "bubbles"}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Every comic page, newest first, with the way to start a new one. */
export function ComicsList() {
  const pages = useQuery(comicListQuery);
  const hydrated = useHydrated();

  return (
    <Section
      title="Your pages"
      titleId="comics-heading"
      description="Panel layouts, speech bubbles and page export. Each panel keeps its own takes."
      count={pages.data?.length ?? null}
      action={<NewPageDialog />}
    >
      {pages.isPending ? (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="aspect-4/3 rounded-sm" />
          ))}
        </div>
      ) : pages.isError ? (
        <div className="flex flex-col items-start gap-3 p-3">
          <p className="text-sm">Comic pages did not load.</p>
          <Button variant="secondary" onClick={() => void pages.refetch()}>
            Try again
          </Button>
        </div>
      ) : pages.data.length === 0 ? (
        <div className="flex flex-col items-start gap-3 p-3">
          <p className="text-sm">
            Comic pages you make show up here. Start one from a template of 1 to 6 panels.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          {pages.data.map((page) => (
            <Tile key={page.id} page={page} hydrated={hydrated} />
          ))}
        </ul>
      )}
    </Section>
  );
}
