"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function ComicsError({
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
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      {/* A rare screen, so it is allowed one comic beat. */}
      <p aria-hidden="true" className="-rotate-3 sfx text-5xl text-flag">
        KRAK
      </p>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">The comic pages did not load.</h1>
        <p className="text-muted-foreground">
          Nothing you made is lost. Try loading it again, or head home.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={retry}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </Card>
  );
}
