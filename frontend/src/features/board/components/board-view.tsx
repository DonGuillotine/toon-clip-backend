"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";

import { boardQuery } from "../queries";
import { useBoardSelection } from "../selection-store";
import { BoardCanvas } from "./board-canvas";
import { SelectionToolbar } from "./selection-toolbar";

export function BoardView({ storyboardId }: { readonly storyboardId: string }) {
  const board = useQuery(boardQuery(storyboardId));
  const [pageParam, setPage] = useQueryState("page", parseAsString);
  const selected = useBoardSelection((state) => state.selected);
  const select = useBoardSelection((state) => state.select);
  const clear = useBoardSelection((state) => state.clear);

  if (board.isPending) {
    return (
      <div className="flex flex-1 flex-col gap-4" aria-busy="true" aria-label="Loading the board">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="min-h-120 flex-1 rounded-xl" />
      </div>
    );
  }

  if (board.isError) {
    const missing = board.error instanceof ApiError && board.error.status === 404;
    return (
      <Card className="flex flex-col items-start gap-4 p-6">
        <p className="text-sm">
          {missing ? "This storyboard has no board." : "The board did not load."}
        </p>
        {missing ? (
          <Button asChild variant="secondary">
            <Link href="/storyboards">All storyboards</Link>
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => void board.refetch()}>
            Try again
          </Button>
        )}
      </Card>
    );
  }

  const data = board.data;
  const firstPage = data.pages[0];
  if (!firstPage) return null;
  const page = data.pages.find((item) => item.id === pageParam) ?? firstPage;
  const onPage = data.nodes.filter((node) => node.pageId === page.id);
  const selectedNodes = onPage.filter((node) => selected.includes(node.id));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Back to the timeline">
            <Link href={`/storyboards/${storyboardId}`}>
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate font-display text-4xl md:text-5xl">Board</h1>
            <p className="truncate text-xs text-muted-foreground">{data.title}</p>
          </div>
        </div>
        <Tabs
          value={page.id}
          onValueChange={(value) => {
            clear();
            void setPage(value);
          }}
          aria-label="Board pages"
        >
          <TabsList>
            {data.pages.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <Card className="relative flex min-h-120 flex-1 flex-col">
        <BoardCanvas
          board={data}
          pageId={page.id}
          selected={selectedNodes.map((node) => node.id)}
          onSelect={select}
          onClear={clear}
        />
        <SelectionToolbar storyboardId={storyboardId} selected={selectedNodes} onDone={clear} />
      </Card>
    </div>
  );
}
