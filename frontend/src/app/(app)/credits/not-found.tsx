import Link from "next/link";

import { RouteNotFound } from "@/components/route-states";
import { Button } from "@/components/ui/button";

export default function SectionNotFound() {
  return (
    <RouteNotFound
      title="This page is not here."
      action={
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      }
    >
      The link may be old, or the page was moved.
    </RouteNotFound>
  );
}
