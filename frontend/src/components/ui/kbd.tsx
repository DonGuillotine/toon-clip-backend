import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A key cap. Tinted from its text colour, so it reads on any fill. */
function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-current/12 px-1 font-sans text-xs font-medium select-none",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
