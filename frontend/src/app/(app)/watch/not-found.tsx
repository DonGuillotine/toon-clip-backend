import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function WatchNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">That clip is not here.</h1>
        <p className="text-muted-foreground">
          The link may be old, or the clip was removed. Everything finished is on the Watch page.
        </p>
      </div>
      <Button asChild>
        <Link href="/watch">All finished work</Link>
      </Button>
    </Card>
  );
}
