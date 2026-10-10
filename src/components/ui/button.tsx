import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Buttons are inked: a solid ink outline, a flat fill, and a press that
 * drops the button one pixel into the page. No soft shadows, no gradients.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md border-2 border-ink font-bold whitespace-nowrap select-none",
    "transition-[background-color,color,transform] duration-(--duration-fast) ease-out",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:border-tone-3 disabled:bg-tone-1 disabled:text-ink-mute",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** The spot-colour action. One per view. */
        default: "bg-spot text-ink hover:bg-spot-deep",
        ink: "bg-ink text-sheet hover:bg-ink-soft",
        outline: "bg-sheet text-ink hover:bg-tone-1 aria-expanded:bg-tone-1",
        ghost: "border-transparent bg-transparent text-ink hover:bg-tone-1 aria-expanded:bg-tone-1",
        destructive: "border-fail bg-sheet text-fail hover:bg-tone-1",
        link: "h-auto border-transparent bg-transparent px-0 text-ink underline decoration-2 underline-offset-4 hover:decoration-spot-deep",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "size-10",
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
  VariantProps<typeof buttonVariants> & {
    readonly asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
