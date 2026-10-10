import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex field-sizing-content w-full text-base text-ink outline-none placeholder:text-ink-mute disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "min-h-20 rounded-md border-2 border-ink bg-sheet px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 aria-invalid:border-fail",
        /** No frame of its own; the surrounding shape (a speech bubble) is the frame. */
        bare: "min-h-16 resize-none border-0 bg-transparent p-0 focus-visible:outline-none",
      },
    },
    defaultVariants: { variant: "default" },
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
