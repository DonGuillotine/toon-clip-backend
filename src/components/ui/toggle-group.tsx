"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * A single-choice segmented control. Items are inked like buttons; the
 * pressed item takes the spot fill. Radix owns roving focus and arrow keys.
 */
export function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex w-fit items-center gap-1", className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border-2 border-transparent px-3 text-sm font-bold whitespace-nowrap select-none",
        "transition-[background-color,border-color,transform] duration-(--duration-fast) ease-out",
        "hover:bg-tone-1 active:translate-y-px",
        "data-[state=on]:border-ink data-[state=on]:bg-spot",
        "disabled:pointer-events-none disabled:text-ink-mute",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
