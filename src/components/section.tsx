import { type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The one section container, so concentric radii are derived in one place:
 *
 *   Card   r=24 (rounded-xl), padding 8
 *   └ Well r=16 (rounded-md) = 24 - 8, padding 4
 *     └ Row r=12 (rounded-sm) = 16 - 4
 *
 * The heading sits on the card (L2); the content sits in a well recessed to
 * L1. That tonal step is the only thing separating them: no rule, no border,
 * no shadow (DESIGN.md §2).
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
      <header className="flex min-h-11 shrink-0 items-center justify-between gap-3 px-3 pt-1.5 pb-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-sm leading-tight font-medium">
              {title}
            </h2>
            {count === undefined || count === null ? null : (
              <span className="tabular rounded-full bg-muted px-2 py-0.5 text-xs leading-tight font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </div>
          {description === undefined ? null : (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action === undefined ? null : <div className="shrink-0">{action}</div>}
      </header>

      <div className={cn(well && "rounded-md bg-muted p-1", "min-h-0 flex-1", wellClassName)}>
        {children}
      </div>

      {footer === undefined ? null : (
        <div className="shrink-0 px-3 pt-3 pb-1 text-xs text-muted-foreground">{footer}</div>
      )}
    </Card>
  );
}

/** The L2 surface on its own, for content that is not a titled section. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn("relative rounded-xl bg-card p-2 text-card-foreground", className)}
      {...props}
    />
  );
}
