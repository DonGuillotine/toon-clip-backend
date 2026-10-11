import { type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The one section container: a navy panel with a 2px edge (DESIGN.md §2).
 *
 *   Card   r=6 (rounded-xl), 2px edge, padding 16
 *   └ Well r=4 (rounded-md), recessed toward the page
 *     └ Row r=3 (rounded-sm)
 *
 * The title is display type, so a section reads like a panel caption.
 */
export function Section({
  title,
  titleId,
  description,
  count,
  action,
  footer,
  children,
  className,
  wellClassName,
  well = true,
}: {
  readonly title: string;
  /** Id for the heading, so the section can be `aria-labelledby` it. */
  readonly titleId: string;
  readonly description?: string;
  /** `null` renders nothing: a section that cannot know its size shows none. */
  readonly count?: number | null;
  readonly action?: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly wellClassName?: string;
  /** Set false when the content is its own surface (a grid of cards, a form). */
  readonly well?: boolean;
}) {
  return (
    <Card aria-labelledby={titleId} className={cn("flex flex-col", className)}>
      <header className="flex min-h-11 shrink-0 items-center justify-between gap-3 pb-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="font-display text-2xl">
              {title}
            </h2>
            {count === undefined || count === null ? null : (
              <span className="tabular rounded-xs border-2 border-edge-control px-2 py-0.5 font-label text-xs leading-tight text-muted-foreground">
                {count}
              </span>
            )}
          </div>
          {description === undefined ? null : (
            <p className="pt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action === undefined ? null : <div className="shrink-0">{action}</div>}
      </header>

      <div className={cn(well && "rounded-md bg-muted p-1.5", "min-h-0 flex-1", wellClassName)}>
        {children}
      </div>

      {footer === undefined ? null : (
        <div className="shrink-0 px-1 pt-3 text-xs text-muted-foreground">{footer}</div>
      )}
    </Card>
  );
}

/** The L2 surface on its own, for content that is not a titled section. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn("relative rounded-xl border-2 border-border bg-card p-4 text-card-foreground", className)}
      {...props}
    />
  );
}
