import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Calm buttons: solid ink for the main action, hairline outline for the rest.
 * No hard ink edge, no offset; a quiet 1px press.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) ease-out",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** The one main action in a view. */
        default: "border-ink bg-ink text-sheet hover:bg-ink-soft",
        /** Highlighter yellow, for the moment something is made. */
        spot: "border-spot-deep bg-spot text-ink hover:bg-spot-deep",
        outline:
          "border-line-strong bg-sheet text-ink shadow-card hover:bg-tone-1 aria-expanded:bg-tone-1",
        ghost:
          "border-transparent bg-transparent text-ink-soft hover:bg-tone-1 hover:text-ink aria-expanded:bg-tone-1",
        link: "h-auto border-transparent bg-transparent px-0 text-ink-soft underline-offset-4 hover:text-ink hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-9 px-3.5 text-sm",
        lg: "h-11 px-4.5 text-sm",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { readonly asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
