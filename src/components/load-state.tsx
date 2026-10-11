import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * "X did not load." plus Try again (DESIGN.md §8). Never the raw error: the
 * copy names what is missing and the way back.
 */
export function LoadError({
  children,
  onRetry,
}: {
  readonly children: ReactNode;
  readonly onRetry: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-3">
      <p className="text-sm">{children}</p>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** One sentence of what goes here, plus at most one action (DESIGN.md §8). */
export function EmptyState({
  children,
  action,
}: {
  readonly children: ReactNode;
  readonly action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 p-3">
      <p className="text-sm text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}

/**
 * Said when some entries came back in a shape this version of the app cannot
 * read. They are counted, not hidden.
 */
export function UnreadableNote({
  count,
  singular,
  plural,
}: {
  readonly count: number;
  readonly singular: string;
  readonly plural: string;
}) {
  if (count === 0) return null;
  return (
    <p className="px-3 py-2 text-xs text-muted-foreground">
      {count === 1
        ? `1 ${singular} could not be shown because this version of Toon Clip cannot read it yet.`
        : `${String(count)} ${plural} could not be shown because this version of Toon Clip cannot read them yet.`}
    </p>
  );
}
