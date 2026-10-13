import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Buttons are printed: Anton caps, a 2px edge, a 4px corner. The main action
 * is green with a hard offset shade under it; pressing it lands the button on
 * its shade (the translate is global, in `globals.css`).
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md border-2 font-label whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,transform,box-shadow] duration-(--duration-press) ease-out-strong",
    "active:shadow-none",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** The one main action in a view. Green, on its printed shade. */
        default:
          "border-canvas bg-primary text-primary-foreground shadow-press hover:bg-primary-hover",
        /** Yellow. For the moment something gets made. */
        spot: "border-canvas bg-spot text-spot-foreground shadow-ink hover:bg-spot-hover",
        /** Everything else: an outline in paper white. */
        secondary:
          "border-foreground bg-transparent text-foreground hover:bg-accent aria-expanded:bg-accent",
        ghost:
          "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        link: "h-auto border-transparent px-0 font-sans font-semibold tracking-normal normal-case text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-5 text-base",
        lg: "h-12 px-6 text-lg",
        icon: "size-11",
        "icon-sm": "size-9",
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
