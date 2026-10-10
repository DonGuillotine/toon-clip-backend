import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex field-sizing-content w-full resize-none text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        /** A slot on its surface: the off-ladder input fill, a box radius (never a pill). */
        field: "min-h-20 rounded-md bg-input px-3.5 py-2.5 focus-visible:outline-2",
        /** No frame of its own; the surrounding card is the frame. */
        bare: "min-h-16 bg-transparent p-0 focus-visible:outline-none",
      },
    },
    defaultVariants: { variant: "field" },
  },
);

type TextareaProps = ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>;

function Textarea({ className, variant, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Textarea };
