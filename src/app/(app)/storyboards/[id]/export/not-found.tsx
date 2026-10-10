import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function ExportNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          There is no storyboard to export here.
        </h1>
        <p className="text-muted-foreground">
          The link may be old, or the storyboard was removed. Pick one from your storyboards.
        </p>
      </div>
      <Button asChild>
        <Link href="/storyboards">All storyboards</Link>
      </Button>
    </Card>
  );
}
