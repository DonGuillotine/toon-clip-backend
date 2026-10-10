"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The floating dock: a column of circles on the right edge of every page.
 * It floats over the page, so it is an overlay and carries the one shadow.
 * Its thickness is control height, so it is a pill (DESIGN.md §3).
 */
export function Dock({ children }: { readonly children: ReactNode }) {
  return (
    <nav
      aria-label="Your work"
      className="fixed end-3 bottom-3 z-40 flex flex-col gap-1 rounded-full bg-card p-1 shadow-overlay lg:end-5 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2"
    >
      {children}
    </nav>
  );
}

/**
 * One circle in the dock. A click (or Enter) opens it and moves focus in;
 * Escape or a click outside closes it. It never opens on hover: the dock is
 * on every page, and content springing out as the pointer passes would be
 * noise.
 */
export function DockItem({
  label,
  icon,
  children,
  bare = false,
}: {
  /** Accessible name of the circle, with its live figure in it. */
  readonly label: string;
  readonly icon: ReactNode;
  readonly children: ReactNode;
  /** Bare content floats with no panel behind it (fans). */
  readonly bare?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Dims the page around the dock while this item is open. Below the
          dock (z-40) and the content (z-50); never takes the pointer. */}
      <AnimatePresence>
        {open ? (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-30 dock-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.menu}
          />
        ) : null}
      </AnimatePresence>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={label}
          className={cn(
            "relative grid size-11 place-items-center rounded-full transition-colors duration-(--duration-press) ease-out-strong",
            "hover:bg-accent data-[state=open]:bg-accent",
          )}
        >
          {icon}
        </PopoverTrigger>
        {/* Force-mounted so Motion can play the exit: the content leaves
            the way it came, fading, shrinking and blurring toward the dock. */}
        <AnimatePresence>
          {open ? (
            <PopoverContent
              forceMount
              side="left"
              align="center"
              sideOffset={16}
              collisionPadding={12}
              bare={bare}
              className="origin-right"
            >
              <motion.div
                className="flex flex-col gap-1"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                transition={transition.menu}
              >
                {children}
              </motion.div>
            </PopoverContent>
          ) : null}
        </AnimatePresence>
      </Popover>
    </>
  );
}

/** A small count on a dock circle. Ink on white, so it reads on any art. */
export function DockCount({ count }: { readonly count: number }) {
  return (
    <span className="tabular absolute -end-0.5 -bottom-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold text-primary-foreground">
      {count}
    </span>
  );
}

/**
 * Items fanned out of a dock circle in an arc, like a Dock stack: each row
 * springs out from the circle, staggered, the middle rows reaching furthest.
 * Every row pairs its visual with a label, so the fan needs no caption.
 */
export function DockFan({ children }: { readonly children: readonly ReactNode[] }) {
  const count = children.length;
  return (
    <ul className="flex flex-col items-end gap-2">
      {children.map((child, index) => {
        const offset = index - (count - 1) / 2;
        return (
          <motion.li
            // Rows are positional: the fan is rebuilt whole each time it opens.
            key={index}
            className="origin-right"
            initial={{
              opacity: 0,
              x: 32,
              y: -offset * 36,
              scale: 0.9,
              rotate: 0,
              filter: "blur(8px)",
            }}
            animate={{
              filter: "blur(0px)",
              opacity: 1,
              x: -(count / 2 - Math.abs(offset)) * 14,
              y: 0,
              scale: 1,
              rotate: offset * -2.5,
            }}
            transition={{ ...transition.spring, delay: Math.abs(offset) * 0.03 }}
          >
            {child}
          </motion.li>
        );
      })}
    </ul>
  );
}

/** A label that floats beside a fanned visual. It is an overlay surface. */
export function FanLabel({
  title,
  detail,
}: {
  readonly title: string;
  readonly detail?: ReactNode;
}) {
  return (
    <span className="flex max-w-56 flex-col items-end rounded-md bg-popover px-3 py-1.5 text-end shadow-overlay">
      <span className="max-w-full truncate text-sm font-medium">{title}</span>
      {detail === undefined ? null : (
        <span className="max-w-full truncate text-xs text-muted-foreground">{detail}</span>
      )}
    </span>
  );
}
