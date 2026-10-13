import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { BoardView } from "@/features/board/components/board-view";

export const metadata: Metadata = { title: "Board" };

export default async function BoardPage({ params }: PageProps<"/storyboards/[id]/board">) {
  const { id } = await params;
  return (
    // nuqs reads the search params, which suspends during prerender.
    <Suspense fallback={<Skeleton className="min-h-120 flex-1 rounded-xl" />}>
      <BoardView storyboardId={id} />
    </Suspense>
  );
}
