import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * A frameless textarea. The card around it is the frame; the card shows focus
 * with `focus-within`, so the field itself draws no outline.
 */
function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-ink-mute focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
