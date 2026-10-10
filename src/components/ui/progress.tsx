"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Fill colour of the bar. */
  readonly tone?: "sky" | "spot" | "ink";
};

const fill = {
  sky: "bg-sky",
  spot: "bg-spot",
  ink: "bg-ink",
} satisfies Record<NonNullable<ProgressProps["tone"]>, string>;

/** An inked bar whose fill carries moving speed lines while it runs. */
function Progress({ className, value, tone = "sky", ...props }: ProgressProps) {
  const percent = Math.min(100, Math.max(0, value ?? 0));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-sheet",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "speed-lines size-full animate-speed border-e-2 border-ink transition-transform duration-(--duration-slow) ease-out [--speed-angle:115deg] [--speed-gap:8px] [--speed-ink:var(--ink-faint)]",
          fill[tone],
        )}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
