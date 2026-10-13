"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { EmptyState, LoadError } from "@/components/load-state";
import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { tourScenario } from "../choices";
import { catalogQuery } from "../queries";

/**
 * `/tour` names no example, so it opens the one the API marks as the tour
 * (or the first published one) at step 1.
 */
export function TourStart() {
  const catalog = useQuery(catalogQuery);
  const router = useRouter();
  const scenario = catalog.data === undefined ? null : tourScenario(catalog.data.scenarios.items);

  useEffect(() => {
    if (scenario !== null) router.replace(`/examples/${encodeURIComponent(scenario.id)}`);
  }, [router, scenario]);

  if (catalog.isError) {
    return (
      <Card className="mx-auto w-full max-w-3xl">
        <LoadError onRetry={() => void catalog.refetch()}>The tour did not load.</LoadError>
      </Card>
    );
  }
  if (catalog.data !== undefined && scenario === null) {
    return (
      <Card className="mx-auto w-full max-w-3xl">
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/">Home</Link>
            </Button>
          }
        >
          The tour walks through a published example, and none is published yet.
        </EmptyState>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Opening the tour">
      <Skeleton className="h-7 w-80 rounded-md" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
