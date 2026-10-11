"use client";

import Link from "next/link";
import { type ReactNode, useEffect } from "react";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

/** A route's error boundary body: what broke, that nothing is lost, and the way back. */
export function RouteError({
  error,
  retry,
  title,
}: {
  readonly error: Error;
  readonly retry: () => void;
  readonly title: string;
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
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          Nothing you made or paid for is lost. Try loading it again, or head home.
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

/** A route's not-found body: what is missing, why, and where to go instead. */
export function RouteNotFound({
  title,
  children,
  action,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly action: ReactNode;
}) {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{children}</p>
      </div>
      {action}
    </Card>
  );
}
