import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <Card className="flex w-full max-w-lg flex-col items-start gap-6 p-6 sm:p-8">
        {/* A rare screen, so it is allowed one comic beat. */}
        <p aria-hidden="true" className="-rotate-3 sfx text-6xl text-spot">
          404
        </p>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">This page is not in the book.</h1>
          <p className="text-muted-foreground">The link may be old, or the page was moved.</p>
        </div>
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      </Card>
    </main>
  );
}
