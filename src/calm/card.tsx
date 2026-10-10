import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** The Calm surface: white, hairline edge, soft radius, barely-there shadow. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn("relative rounded-card border border-line bg-sheet shadow-card", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      className={cn("flex min-h-14 items-center justify-between gap-3 px-4 py-3", className)}
      {...props}
    />
  );
}
