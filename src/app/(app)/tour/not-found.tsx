import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function TourNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          That part of the tour does not exist.
        </h1>
        <p className="text-muted-foreground">Start the tour from the beginning.</p>
      </div>
      <Button asChild>
        <Link href="/tour">Start the tour</Link>
      </Button>
    </Card>
  );
}
