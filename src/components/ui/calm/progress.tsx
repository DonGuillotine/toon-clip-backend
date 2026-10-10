"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * A thin, quiet bar. The one comic touch: faint speed lines run through the
 * fill while it moves, so progress reads as motion, not a static meter.
 */
function Progress({ className, value, ...props }: ComponentProps<typeof ProgressPrimitive.Root>) {
  const percent = Math.min(100, Math.max(0, value ?? 0));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-tone-2", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full animate-speed rounded-full bg-sky-ink speed-lines transition-transform duration-(--duration-slow) ease-out [--speed-angle:115deg] [--speed-gap:6px] [--speed-ink:oklch(1_0_0/0.35)] [--speed-weight:1px]"
        style={{ transform: `translateX(-${String(100 - percent)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
