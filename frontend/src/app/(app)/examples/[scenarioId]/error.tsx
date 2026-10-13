"use client";

import { RouteError } from "@/components/route-states";

export default function ExampleError({
  error,
  retry,
}: {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}) {
  return <RouteError error={error} retry={retry} title="This example did not load." />;
}
