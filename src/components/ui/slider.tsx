"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * A single-thumb slider on Radix, so arrow keys, Page Up and Down, Home and
 * End, and the slider role come from the library. The thumb's hit area is
 * 44px (AGENTS.md §8) while the visible thumb stays small.
 */
function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-pending"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full rounded-full bg-primary"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={props["aria-label"]}
        className="relative block size-4 rounded-full bg-primary outline-offset-2 transition-transform duration-(--duration-press) ease-out-strong after:absolute after:-inset-3.5 after:content-[''] focus-visible:outline-2 active:scale-95"
      />
    </SliderPrimitive.Root>
  );
}

export { Slider };
