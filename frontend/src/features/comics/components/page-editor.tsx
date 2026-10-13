"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import { useId, useState } from "react";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";

import { LAYOUTS } from "../layouts";
import { useComicAction, useDeleteComic } from "../mutations";
import { comicPageQuery } from "../queries";
import { type ComicPage, TITLE_MAX } from "../schema";
import { PageCanvas } from "./page-canvas";
import { PageExport } from "./page-export";
import { PanelInspector } from "./panel-inspector";

export function ComicEditorSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading comic page">
      <Skeleton className="h-9 w-64 rounded-md" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="aspect-2/3 rounded-xl lg:col-span-7" />
        <Skeleton className="h-96 rounded-xl lg:col-span-5" />
      </div>
    </div>
  );
}

/** The title, edited in place. Saved when the field loses focus or on Enter. */
function TitleField({ page }: { readonly page: ComicPage }) {
  const id = useId();
  const action = useComicAction(page.id);
  const [draft, setDraft] = useState(page.title);

  const save = () => {
    const title = draft.trim();
    if (title === "") {
      setDraft(page.title);
      return;
    }
    if (title !== page.title) action.mutate({ type: "rename", title });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <Label htmlFor={id} className="sr-only">
        Page title
      </Label>
      <Input
        id={id}
        value={draft}
        maxLength={TITLE_MAX}
        className="text-lg font-semibold"
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(page.title);
            event.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}

function DeletePage({ page }: { readonly page: ComicPage }) {
  const router = useRouter();
  const remove = useDeleteComic();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Delete page">
          <Trash2 aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {page.title}?</DialogTitle>
          <DialogDescription>
            The page, its panels, every take and its exports are removed. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Keep page</Button>
          </DialogClose>
          <Button
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(page.id, {
                onSuccess: () => {
                  router.push("/comics");
                },
              });
            }}
          >
            Delete page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The page editor: the template grid with panels and bubbles, an inspector
 * for the selected panel, and export. The selected panel and bubble live in
 * the URL (`?panel=` and `?bubble=`), so a pasted link opens the same view.
 */
export function PageEditor({ id }: { readonly id: string }) {
  const query = useQuery(comicPageQuery(id));
  const action = useComicAction(id);
  const [selection, setSelection] = useQueryStates({
    panel: parseAsString,
    bubble: parseAsString,
  });

  if (query.isPending) return <ComicEditorSkeleton />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) notFound();
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm">This page did not load. Nothing you made is lost.</p>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  const page = query.data;
  const panel = page.panels.find((item) => item.id === selection.panel) ?? page.panels[0];
  if (!panel) notFound();
  const bubbleId = panel.bubbles.some((bubble) => bubble.id === selection.bubble)
    ? selection.bubble
    : null;

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="All comic pages">
          <Link href="/comics">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <TitleField key={page.title} page={page} />
        <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
          {LAYOUTS[page.layout].label}
        </span>
        <DeletePage page={page} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12">
        <Card className="flex flex-col gap-2 lg:col-span-7 lg:self-start">
          <PageCanvas
            page={page}
            selectedPanelId={panel.id}
            selectedBubbleId={bubbleId}
            handlers={{
              onSelectPanel: (panelId) => {
                void setSelection({ panel: panelId, bubble: null });
              },
              onSelectBubble: (panelId, nextBubble) => {
                void setSelection({ panel: panelId, bubble: nextBubble });
              },
              onMoveBubble: (panelId, nextBubble, point) => {
                action.mutate({
                  type: "moveBubble",
                  panelId,
                  bubbleId: nextBubble,
                  x: point.x,
                  y: point.y,
                });
              },
              onDeleteBubble: (panelId, nextBubble) => {
                action.mutate({ type: "deleteBubble", panelId, bubbleId: nextBubble });
                void setSelection({ panel: panelId, bubble: null });
              },
            }}
          />
        </Card>

        <div className="flex flex-col gap-4 md:gap-8 lg:col-span-5">
          <PanelInspector
            page={page}
            panel={panel}
            selectedBubbleId={bubbleId}
            onSelectBubble={(next) => {
              void setSelection({ panel: panel.id, bubble: next });
            }}
          />
          <PageExport page={page} />
        </div>
      </div>
    </div>
  );
}
