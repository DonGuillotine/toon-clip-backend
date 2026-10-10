"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root> & { readonly size?: "sm" | "default" }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "group relative inline-flex shrink-0 items-center rounded-full bg-input p-0.5 transition-[background-color] duration-(--duration-press) ease-out-strong after:absolute after:-inset-3 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 data-checked:bg-primary data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block rounded-full bg-background transition-transform duration-(--duration-press) ease-out-strong group-data-[size=default]:size-4 group-data-[size=sm]:size-3 group-data-[size=default]:data-checked:translate-x-4 group-data-[size=sm]:data-checked:translate-x-3" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
