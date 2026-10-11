import { type Metadata } from "next";
import { Suspense } from "react";

import { ExportSkeleton, ExportView } from "@/features/projects/components/export-view";

export const metadata: Metadata = { title: "Export" };

export default async function ExportPage({ params }: PageProps<"/projects/[id]/export">) {
  const { id } = await params;
  return (
    // nuqs reads the search params (`?export=`), which suspends during prerender.
    <Suspense fallback={<ExportSkeleton />}>
      <ExportView projectId={id} />
    </Suspense>
  );
}
