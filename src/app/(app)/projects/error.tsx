"use client";

import { RouteError } from "@/components/route-states";

export default function ProjectsError({
  error,
  retry,
}: {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}) {
  return <RouteError error={error} retry={retry} title="Your projects did not load." />;
}
