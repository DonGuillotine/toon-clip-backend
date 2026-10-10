import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { type Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { QuickCreate } from "@/features/create/components/quick-create";
import { RecentGenerations } from "@/features/create/components/recent-generations";
import { modelsQuery } from "@/features/create/queries";
import { getModels } from "@/features/create/server";
import { getQueryClient } from "@/lib/query/client";

export const metadata: Metadata = { title: "Quick create" };

/** One-off images, video, audio, compositions and stitches (spec 7.2). */
export default function QuickCreatePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Quick create</h1>
        <p className="text-muted-foreground">
          One image, clip, sound, composition or stitch. Cost shows before you generate.
        </p>
      </header>
      {/* The model matrix is read per request; nuqs reads the search params. */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <Prefetched />
      </Suspense>
    </div>
  );
}

async function Prefetched() {
  await connection();
  const queryClient = getQueryClient();
  // CONTRACT: once models come from the backend, this read becomes a fetch.
  await queryClient.query({ ...modelsQuery, queryFn: getModels });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6">
        <QuickCreate />
        <RecentGenerations titleId="recent-quick-creates" />
      </div>
    </HydrationBoundary>
  );
}
