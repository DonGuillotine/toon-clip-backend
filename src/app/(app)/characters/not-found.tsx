import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function CharacterNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          That character is not in your cast.
        </h1>
        <p className="text-muted-foreground">
          The link may be old, or the sheet was deleted. Your cast is on the desk.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/desk">Open the desk</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/characters/new">New character</Link>
        </Button>
      </div>
    </Card>
  );
}
