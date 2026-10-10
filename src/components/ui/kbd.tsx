import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm border-2 border-current px-1 font-sans text-xs font-bold select-none",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
