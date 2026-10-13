"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * A delete that asks once, in place: the first press turns into a question
 * with the real consequence, the second press does it. Used inside dialogs
 * that already hold focus, so no second dialog stacks on the first.
 */
export function ConfirmDelete({
  noun,
  consequence,
  pending,
  onConfirm,
}: {
  readonly noun: string;
  readonly consequence: string;
  readonly pending: boolean;
  readonly onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button
        variant="ghost"
        className="text-destructive-foreground sm:me-auto"
        onClick={() => {
          setAsking(true);
        }}
      >
        <Trash2 aria-hidden="true" /> Delete {noun}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Confirm deleting the ${noun}`}
      className="flex flex-col gap-2 rounded-md bg-muted p-3 sm:me-auto"
    >
      <p className="text-sm">{consequence}</p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAsking(false);
          }}
        >
          Keep it
        </Button>
        <Button size="sm" disabled={pending} onClick={onConfirm}>
          <Trash2 aria-hidden="true" /> Delete
        </Button>
      </div>
    </div>
  );
}
