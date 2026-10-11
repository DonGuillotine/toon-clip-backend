import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function QuickCreateNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">That page is not in Quick create.</h1>
        <p className="text-muted-foreground">The link may be old. Start a new one instead.</p>
      </div>
      <Button asChild>
        <Link href="/create">Open Quick create</Link>
      </Button>
    </Card>
  );
}
