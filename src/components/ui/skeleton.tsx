import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A placeholder matching the final layout's size. A soft pulse, one rung down. */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-secondary", className)}
      {...props}
    />
  );
}

export { Skeleton };
