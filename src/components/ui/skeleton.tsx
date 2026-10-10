import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Loading placeholder: a drifting screentone, not a grey pulse. */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "tone-dots animate-tone-drift rounded-md bg-tone-1 [--tone-ink:var(--tone-3)] [--tone-size:8px]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
