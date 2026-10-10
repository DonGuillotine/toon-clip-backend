import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full border-2 px-2 text-xs font-bold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "border-ink bg-sheet text-ink",
        spot: "border-ink bg-spot text-ink",
        ink: "border-ink bg-ink text-sheet",
        pop: "border-pop-ink bg-sheet text-pop-ink",
        sky: "border-sky-ink bg-sheet text-sky-ink",
        fail: "border-fail bg-sheet text-fail",
        quiet: "border-transparent bg-tone-1 text-ink-soft",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { readonly asChild?: boolean };

function Badge({ className, variant = "default", asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
