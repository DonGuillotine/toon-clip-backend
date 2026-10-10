"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Switch({ className, size = "default", ...props }: ComponentProps<typeof SwitchPrimitive.Root> & { readonly size?: "sm" | "default" }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "group relative inline-flex shrink-0 items-center rounded-full bg-input outline-none after:absolute after:-inset-2 focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-primary data-disabled:pointer-events-none data-disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-background transition-transform duration-(--duration-press) ease-out-strong group-data-[size=default]:data-checked:translate-x-4 group-data-[size=sm]:data-checked:translate-x-3" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
