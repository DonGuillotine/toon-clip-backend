import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Every button is control height, so every button is `rounded-full`. No
 * border and no shadow: the fill is the only thing separating a button from
 * its surface. Press feedback (scale 0.97) is global, in `globals.css`.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none",
    "transition-[background-color,color,transform] duration-(--duration-press) ease-out-strong",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** The one main action in a view. Ink. */
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        /** The highlighter. For the moment something gets made. */
        spot: "bg-spot text-spot-foreground hover:bg-spot-hover",
        /** Everything else: a tonal fill one step off the surface. */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover aria-expanded:bg-secondary-hover",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        link: "h-auto px-0 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm",
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
