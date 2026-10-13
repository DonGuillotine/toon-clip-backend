import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The words that matter in a title, printed in the action green. At most one
 * per view: it is the page's single loud mark.
 */
export function Highlight({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <span className={cn("text-primary", className)}>{children}</span>
  );
}
