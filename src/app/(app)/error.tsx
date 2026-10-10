"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Panel } from "@/components/manga/panel";
import { SpeechBubble } from "@/components/manga/speech-bubble";
import { Button } from "@/components/ui/button";

export default function AppError({
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
    <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-10 sm:px-6 lg:px-10">
      <Panel className="flex flex-col items-start gap-8 p-8 sm:p-10">
        <p aria-hidden="true" className="-rotate-3 sfx text-6xl text-pop">
          KRAK
        </p>
        <SpeechBubble className="max-w-lg p-6">
          <h1 className="font-display text-2xl">This page broke.</h1>
          <p className="mt-2 text-ink-soft">
            Nothing you made is lost. Try loading it again, or head home.
          </p>
        </SpeechBubble>
        <div className="flex gap-3 pt-4">
          <Button onClick={retry}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}
