"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card } from "@/calm/card";
import { Button } from "@/components/ui/calm/button";

export default function CalmError({
  error,
  retry,
}: {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10 sm:px-6 lg:px-10">
      <Card className="flex flex-col items-start gap-6 p-6 sm:p-8">
        <p
          aria-hidden="true"
          className="-rotate-3 sfx text-5xl text-pop [-webkit-text-stroke-width:6px]"
        >
          KRAK
        </p>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">This page broke.</h1>
          <p className="text-ink-soft">
            Nothing you made is lost. Try loading it again, or head home.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={retry}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/calm">Go home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
