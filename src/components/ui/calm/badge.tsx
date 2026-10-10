import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-tone-1 text-ink-soft",
        /** Sits on cover art: a frosted chip. */
        overlay: "bg-sheet/90 text-ink shadow-card backdrop-blur-sm",
        spot: "bg-spot text-ink",
        pop: "bg-pop/12 text-pop-ink",
        sky: "bg-sky/15 text-sky-ink",
        fail: "bg-fail/10 text-fail",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
