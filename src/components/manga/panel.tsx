import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

type PanelProps = ComponentProps<"section">;

/**
 * A manga panel: square corners, a heavy ink border, white paper inside.
 * Panels sit on the page with gutters between them; they never nest.
 */
export function Panel({ className, ...props }: PanelProps) {
  return (
    <section
      data-slot="panel"
      className={cn(
        "relative overflow-hidden rounded-panel border-3 border-ink bg-sheet shadow-panel",
        className,
      )}
      {...props}
    />
  );
}

/** The narration box that sits in a panel's corner. */
export function Caption({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="caption"
      className={cn("border-2 border-ink bg-sheet px-3 py-2", className)}
      {...props}
    />
  );
}
