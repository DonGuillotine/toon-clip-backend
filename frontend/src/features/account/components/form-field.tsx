"use client";

import { type ReactElement, useId } from "react";

import { Label } from "@/components/ui/label";

type ControlProps = {
  readonly id: string;
  readonly "aria-invalid": boolean;
  readonly "aria-describedby": string | undefined;
};

/**
 * A labelled form field with its hint and error wired to the control, so
 * every account form reads the same way to a screen reader. The control is
 * rendered by the caller with the ids this passes in.
 */
export function FormField({
  label,
  hint,
  error,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly error: string | undefined;
  readonly children: (props: ControlProps) => ReactElement;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error === undefined ? null : errorId, hint === undefined ? null : hintId]
      .filter((value) => value !== null)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": error !== undefined, "aria-describedby": describedBy })}
      {error === undefined ? null : (
        <p id={errorId} className="text-xs text-destructive-foreground">
          {error}
        </p>
      )}
      {hint === undefined ? null : (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
