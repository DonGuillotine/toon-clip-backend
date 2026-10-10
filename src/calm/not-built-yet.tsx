import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/calm/button";

import { Card } from "./card";
import { MarginNote } from "./comic/margin-note";

type CalmNotBuiltYetProps = {
  readonly title: string;
  /** One sentence on what this screen will do, from PRODUCT.md. */
  readonly purpose: string;
};

/** Placeholder for a route that is on the roadmap but not built yet. */
export function CalmNotBuiltYet({ title, purpose }: CalmNotBuiltYetProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
      <Card className="flex flex-col items-start gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-lg text-ink-soft">{purpose}</p>
        </div>
        <MarginNote>Still on the drawing board</MarginNote>
        <Button asChild variant="outline">
          <Link href="/calm">
            <ArrowLeft aria-hidden="true" /> Back home
          </Link>
        </Button>
      </Card>
    </div>
  );
}
