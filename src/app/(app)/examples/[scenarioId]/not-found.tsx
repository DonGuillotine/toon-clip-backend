import Link from "next/link";

import { RouteNotFound } from "@/components/route-states";
import { Button } from "@/components/ui/button";

export default function ExampleNotFound() {
  return (
    <RouteNotFound
      title="That example is not published."
      action={
        <Button asChild>
          <Link href="/">See the examples</Link>
        </Button>
      }
    >
      The link may be old, or the example was taken down. The ones you can use are on the home page.
    </RouteNotFound>
  );
}
