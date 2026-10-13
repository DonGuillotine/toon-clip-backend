import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function AudioNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">That clip is not here.</h1>
        <p className="text-muted-foreground">
          It may have been deleted, or the link is old. Your library is one click away.
        </p>
      </div>
      <Button asChild>
        <Link href="/audio">Open music and voices</Link>
      </Button>
    </Card>
  );
}
