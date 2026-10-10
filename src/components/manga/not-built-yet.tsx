import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Panel } from "./panel";
import { SpeechBubble } from "./speech-bubble";

type NotBuiltYetProps = {
  readonly title: string;
  /** One sentence on what this screen will do, from PRODUCT.md. */
  readonly purpose: string;
};

/** Placeholder for a route that is on the roadmap but not built yet. */
export function NotBuiltYet({ title, purpose }: NotBuiltYetProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
      <Panel className="flex min-h-96 flex-col justify-between gap-8 p-8 sm:p-10">
        <div
          aria-hidden="true"
          className="speed-lines pointer-events-none absolute inset-0 [--speed-angle:0deg] [--speed-gap:14px] [--speed-ink:var(--tone-2)] [mask-image:linear-gradient(90deg,transparent_30%,black)]"
        />
        <h1 className="relative font-display text-4xl sm:text-5xl">{title}</h1>
        <SpeechBubble className="relative max-w-lg p-6">
          <p className="font-letter text-xl">{purpose}</p>
          <p className="mt-2 text-sm text-ink-soft">This screen is next on the drawing board.</p>
        </SpeechBubble>
        <div className="relative pt-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft aria-hidden="true" /> Back home
            </Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}
