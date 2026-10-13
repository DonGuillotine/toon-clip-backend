import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ExportPanel } from "@/features/export/components/export-panel";
import { exportsQuery } from "@/features/export/queries";
import { getExports } from "@/features/export/server";
import { getQueryClient } from "@/lib/query/client";

export const metadata: Metadata = { title: "Export" };

export default async function ExportPage({ params }: PageProps<"/storyboards/[id]/export">) {
  const { id } = await params;
  const data = getExports(id);
  if (data === null) notFound();

  // Prefetch on the server from the same source the route handler reads.
  const queryClient = getQueryClient();
  queryClient.setQueryData(exportsQuery(id).queryKey, data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* nuqs reads the search params, which suspends during prerender. */}
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <ExportPanel storyboardId={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
