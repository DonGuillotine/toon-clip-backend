import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border-2 border-border bg-input px-4 text-sm text-foreground transition-[background-color,color] duration-(--duration-press) ease-out-strong file:me-2 file:inline-flex file:h-7 file:items-center file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 aria-invalid:bg-destructive/10",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
