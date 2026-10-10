"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * An overlay panel: r20 with 4px padding, so rows inside are r16. It leaves
 * the document flow, so it carries the one shadow in the system.
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  bare = false,
  forceMount,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content> & {
  /** No panel: the content floats on its own surfaces (a fan of cards). */
  readonly bare?: boolean;
}) {
  // Passed only when set: an explicit `undefined` is not a valid value here.
  const mount = forceMount ? { forceMount } : {};
  return (
    <PopoverPrimitive.Portal {...mount}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        {...mount}
        className={cn(
          "z-50 flex origin-(--radix-popover-content-transform-origin) flex-col text-sm text-popover-foreground outline-hidden",
          bare ? "" : "w-80 gap-1 rounded-lg bg-popover p-1 shadow-overlay",
          // A force-mounted popover is animated by its owner (Motion), so the
          // CSS enter and exit would only fight it.
          forceMount
            ? ""
            : "duration-(--duration-menu) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
