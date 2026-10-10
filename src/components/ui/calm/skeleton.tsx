import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A plain soft pulse. */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-tone-1", className)}
      {...props}
    />
  );
}

export { Skeleton };
