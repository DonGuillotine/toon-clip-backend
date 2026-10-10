import Link from "next/link";

import { Panel } from "@/components/manga/panel";
import { SpeechBubble } from "@/components/manga/speech-bubble";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-4 py-10 sm:px-6">
      <Panel className="flex flex-col items-start gap-8 p-8 sm:p-10">
        <p aria-hidden="true" className="sfx -rotate-3 text-7xl text-spot">
          404
        </p>
        <SpeechBubble className="max-w-lg p-6">
          <h1 className="font-display text-2xl">This page is not in the book.</h1>
          <p className="mt-2 text-ink-soft">The link may be old, or the page was moved.</p>
        </SpeechBubble>
        <div className="pt-4">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </Panel>
    </main>
  );
}
