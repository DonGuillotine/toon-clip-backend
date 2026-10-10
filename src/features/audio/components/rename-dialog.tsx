"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Rename a clip or a voice. The draft is local until saved. */
export function RenameDialog({
  open,
  noun,
  current,
  maxLength,
  onOpenChange,
  onSave,
}: {
  readonly open: boolean;
  /** "clip" or "voice", for the copy. */
  readonly noun: string;
  readonly current: string;
  readonly maxLength: number;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (name: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <RenameBody
          key={current}
          noun={noun}
          current={current}
          maxLength={maxLength}
          onSave={onSave}
        />
      ) : null}
    </Dialog>
  );
}

function RenameBody({
  noun,
  current,
  maxLength,
  onSave,
}: {
  readonly noun: string;
  readonly current: string;
  readonly maxLength: number;
  readonly onSave: (name: string) => void;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState(current);
  const trimmed = draft.trim();
  const valid = trimmed.length > 0 && trimmed.length <= maxLength;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename {noun}</DialogTitle>
        <DialogDescription>Names help you find it later. Nothing else changes.</DialogDescription>
      </DialogHeader>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave(trimmed);
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>Name</Label>
          <Input
            id={inputId}
            value={draft}
            maxLength={maxLength}
            aria-invalid={!valid}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={!valid || trimmed === current}>
            Save name
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
