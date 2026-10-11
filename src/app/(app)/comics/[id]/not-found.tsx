import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function ComicPageNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">That comic page is not here.</h1>
        <p className="text-muted-foreground">
          The link may be old, or the page was deleted. Your other pages are in the list.
        </p>
      </div>
      <Button asChild>
        <Link href="/comics">All comic pages</Link>
      </Button>
    </Card>
  );
}
