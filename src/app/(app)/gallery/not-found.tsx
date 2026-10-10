import Link from "next/link";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function GalleryNotFound() {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">That page is not in the gallery.</h1>
        <p className="text-muted-foreground">
          The link may be old. Your collections and finished work are in the gallery.
        </p>
      </div>
      <Button asChild>
        <Link href="/gallery">Open the gallery</Link>
      </Button>
    </Card>
  );
}
