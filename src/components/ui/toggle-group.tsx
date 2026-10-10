"use client";

import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { createContext, useContext, type ComponentProps } from "react";

import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type ToggleGroupOptions = VariantProps<typeof toggleVariants> & { readonly spacing?: number; readonly orientation?: "horizontal" | "vertical" };
const ToggleGroupContext = createContext<ToggleGroupOptions>({ size: "default", variant: "default", spacing: 2, orientation: "horizontal" });
const spacingClasses: Readonly<Record<number, string>> = { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 5: "gap-5", 6: "gap-6" };

function ToggleGroup({ className, variant, size, spacing = 2, orientation = "horizontal", children, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root> & ToggleGroupOptions) {
  const gap = spacingClasses[spacing] ?? "gap-2";
  return (
    <ToggleGroupPrimitive.Root data-slot="toggle-group" data-variant={variant} data-size={size} data-spacing={spacing} data-orientation={orientation} className={cn("group/toggle-group flex w-fit flex-row items-center data-vertical:flex-col data-vertical:items-stretch", gap, className)} {...props}>
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({ className, children, variant = "default", size = "default", ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
  const context = useContext(ToggleGroupContext);
  const activeVariant = context.variant ?? variant;
  const activeSize = context.size ?? size;
  return <ToggleGroupPrimitive.Item data-slot="toggle-group-item" data-variant={activeVariant} data-size={activeSize} className={cn(toggleVariants({ variant: activeVariant, size: activeSize }), className)} {...props}>{children}</ToggleGroupPrimitive.Item>;
}

export { ToggleGroup, ToggleGroupItem };
