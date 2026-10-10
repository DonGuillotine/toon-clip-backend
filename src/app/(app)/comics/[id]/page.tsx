import { type Metadata } from "next";
import { Suspense } from "react";

import { ComicEditorSkeleton, PageEditor } from "@/features/comics/components/page-editor";

export const metadata: Metadata = { title: "Comic page" };

export default async function ComicPageRoute({ params }: PageProps<"/comics/[id]">) {
  const { id } = await params;
  return (
    // nuqs reads the search params, which suspends during prerender.
    <Suspense fallback={<ComicEditorSkeleton />}>
      <PageEditor id={id} />
    </Suspense>
  );
}
