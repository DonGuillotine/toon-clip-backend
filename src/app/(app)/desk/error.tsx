"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function DeskError({
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
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">The desk broke.</h1>
        <p className="text-muted-foreground">
          Your characters and palettes are safe. Load the desk again, or head home.
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
