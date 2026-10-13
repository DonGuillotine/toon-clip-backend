"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Delete asks first and says what happens to work that already uses the character. */
export function DeleteCharacterDialog({
  name,
  pending,
  onConfirm,
}: {
  readonly name: string;
  readonly pending: boolean;
  readonly onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Trash2 aria-hidden="true" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            The sheet and its images go. Shots already generated keep their takes, but new shots can
            no longer use {name} as a reference.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Keep {name}</Button>
          </DialogClose>
          <Button
            disabled={pending}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            <Trash2 aria-hidden="true" /> Delete character
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
