"use client";

import { CircleAlert, Coins } from "lucide-react";
import { type RefObject, useState } from "react";

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
import { Kbd } from "@/components/ui/kbd";
import { formatCredits } from "@/lib/format";

/** Where credits are topped up: the credits section of the profile. */
export const TOP_UP_HREF = "/profile#credits";

type GenerateBarProps = {
  /** From the API quote; `null` while pricing. */
  readonly cost: number | null;
  /** From the API quote: large spends are confirmed first. */
  readonly requiresConfirmation: boolean;
  readonly balance: number | null;
  /** True when something other than credits blocks generating. */
  readonly blocked: boolean;
  readonly pending: boolean;
  readonly onGenerate: () => void;
  /** Lets a composer's keyboard shortcut press Generate, confirmation included. */
  readonly triggerRef?: RefObject<HTMLButtonElement | null>;
};

/** True when the quote is known and the balance cannot cover it. */
export function isShort(cost: number | null, balance: number | null): boolean {
  return cost !== null && balance !== null && cost > balance;
}

/**
 * Cost, the credit check and Generate, shared by every composer. Cost is shown
 * before the action; short credits show a notice and disable Generate; a large
 * spend asks first.
 */
export function GenerateBar({
  cost,
  requiresConfirmation,
  balance,
  blocked,
  pending,
  onGenerate,
  triggerRef,
}: GenerateBarProps) {
  const [confirming, setConfirming] = useState(false);
  const short = isShort(cost, balance);
  const disabled = blocked || short || pending || cost === null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <p className="flex items-center gap-1.5 px-1.5 text-sm" aria-live="polite">
        <Coins className="size-4 text-muted-foreground" aria-hidden="true" />
        {cost === null ? (
          <span className="text-muted-foreground">Pricing…</span>
        ) : (
          <span>
            <span className="tabular font-medium">{formatCredits(cost)}</span>{" "}
            <span className="text-muted-foreground">credits</span>
          </span>
        )}
      </p>
      {short ? (
        <p
          role="status"
          className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive-foreground"
        >
          <CircleAlert aria-hidden="true" className="size-3.5" />
          Insufficient credits
        </p>
      ) : null}
      {short ? (
        <Button asChild variant="secondary" size="sm">
          {/* A plain link until the profile route is typed in this tree. */}
          <a href={TOP_UP_HREF}>Top up</a>
        </Button>
      ) : null}
      <Button
        ref={triggerRef}
        size="lg"
        disabled={disabled}
        onClick={() => {
          if (requiresConfirmation) setConfirming(true);
          else onGenerate();
        }}
      >
        {pending ? "Starting…" : "Generate"}
        <Kbd className="hidden sm:inline-flex">⌘↵</Kbd>
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spend {cost === null ? "" : formatCredits(cost)} credits?</DialogTitle>
            <DialogDescription>
              This is a large generation.
              {balance === null ? "" : ` You have ${formatCredits(balance)} credits.`} Failed
              generations are refunded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                setConfirming(false);
                onGenerate();
              }}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
