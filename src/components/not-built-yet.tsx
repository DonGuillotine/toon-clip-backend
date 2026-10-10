import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { MarginNote } from "./comic/margin-note";
import { Card } from "./section";

type NotBuiltYetProps = {
  readonly title: string;
  /** One sentence on what this screen will do, from PRODUCT.md. */
  readonly purpose: string;
};

/** Placeholder for a route that is on the roadmap but not built yet. */
export function NotBuiltYet({ title, purpose }: NotBuiltYetProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <Card className="flex flex-col items-start gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-lg text-muted-foreground">{purpose}</p>
        </div>
        <MarginNote>Still on the drawing board</MarginNote>
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft aria-hidden="true" /> Back home
          </Link>
        </Button>
      </Card>
    </div>
  );
}
