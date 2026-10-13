"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "relative flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground bg-input transition-[background-color] duration-(--duration-press) ease-out-strong after:absolute after:-inset-3 disabled:pointer-events-none disabled:opacity-50 data-checked:bg-primary",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="size-2 rounded-full bg-primary-foreground"
        data-slot="radio-group-indicator"
      />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
