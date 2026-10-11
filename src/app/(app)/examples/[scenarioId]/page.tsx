import { type Metadata } from "next";
import { Suspense } from "react";

import { ExampleView } from "@/features/catalog/components/example-view";

import ExampleLoading from "./loading";

export const metadata: Metadata = { title: "Example" };

export default async function ExamplePage({ params }: PageProps<"/examples/[scenarioId]">) {
  const { scenarioId } = await params;
  return (
    // nuqs reads the search params (`?choice=`), which suspends during prerender.
    <Suspense fallback={<ExampleLoading />}>
      <ExampleView scenarioId={scenarioId} />
    </Suspense>
  );
}
