"use client";

import { RouteError } from "@/components/route-states";

export default function ExportError({
  error,
  retry,
}: {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}) {
  return <RouteError error={error} retry={retry} title="The export did not load." />;
}
