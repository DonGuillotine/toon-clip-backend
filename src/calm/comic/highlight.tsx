import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A highlighter swipe behind a word, slightly crooked as if drawn by hand.
 * Used once per view at most: it is the page's single loud mark.
 */
export function Highlight({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <span className={cn("relative inline-block px-1.5", className)}>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-[22%] bottom-[8%] -rotate-[1.5deg] rounded-[0.2em_0.5em_0.25em_0.6em] bg-spot"
      />
      <span className="relative">{children}</span>
    </span>
  );
}
