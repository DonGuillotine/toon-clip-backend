"use client";

import { RouteError } from "@/components/route-states";

export default function CreditsError({
  error,
  retry,
}: {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}) {
  return <RouteError error={error} retry={retry} title="Your credits did not load." />;
}
