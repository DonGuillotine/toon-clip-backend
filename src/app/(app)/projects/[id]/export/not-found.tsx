import Link from "next/link";

import { RouteNotFound } from "@/components/route-states";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <RouteNotFound
      title="That project is not here."
      action={
        <Button asChild>
          <Link href="/projects">Your projects</Link>
        </Button>
      }
    >
      Projects belong to the browser session that made them. The link may be from another browser,
      or from a session that has ended.
    </RouteNotFound>
  );
}
