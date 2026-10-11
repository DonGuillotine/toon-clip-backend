import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function BoardNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">This board is not here.</h1>
        <p className="text-muted-foreground">The storyboard may have been moved or deleted.</p>
      </div>
      <Button asChild>
        <Link href="/storyboards">All storyboards</Link>
      </Button>
    </Card>
  );
}
