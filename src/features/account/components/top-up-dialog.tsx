"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Coins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCredits } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useTopUp } from "../mutations";
import { accountQuery, creditPacksQuery } from "../queries";
import { useTopUpStore } from "../top-up-store";

/**
 * The one top-up dialog (spec 7.8), mounted in the shell. Every "Top up"
 * button and every insufficient-credits notice opens it through the store.
 * Packs and the new balance both come from the API.
 */
export function TopUpDialog() {
  const open = useTopUpStore((state) => state.open);
  const setOpen = useTopUpStore((state) => state.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {open ? (
        <TopUpBody
          onDone={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function TopUpBody({ onDone }: { readonly onDone: () => void }) {
  const needed = useTopUpStore((state) => state.needed);
  const account = useQuery(accountQuery);
  const packs = useQuery(creditPacksQuery);
  const topUp = useTopUp();
  const [choice, setChoice] = useState<string | null>(null);

  const balance = account.data?.credits ?? null;
  const shortBy = needed !== null && balance !== null ? Math.max(0, needed - balance) : null;
  // Preselect the smallest pack that covers what the user was trying to do.
  const suggested =
    packs.data?.find((pack) => shortBy === null || pack.credits >= shortBy)?.id ??
    packs.data?.at(-1)?.id ??
    null;
  const selected = choice ?? suggested;
  const pack = packs.data?.find((item) => item.id === selected) ?? null;

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Top up credits</DialogTitle>
        <DialogDescription aria-live="polite">
          {balance === null
            ? "Checking your balance."
            : `You have ${formatCredits(balance)} credits.`}
          {shortBy !== null && shortBy > 0 ? ` That needs ${formatCredits(shortBy)} more.` : null}
        </DialogDescription>
      </DialogHeader>

      {packs.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
        </div>
      ) : packs.isError ? (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted p-3 text-sm">
          <p>The credit packs did not load.</p>
          <Button size="sm" variant="secondary" onClick={() => void packs.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <RadioGroup
          aria-label="Credit pack"
          value={selected ?? ""}
          onValueChange={setChoice}
          className="flex flex-col gap-1 rounded-md bg-muted p-1"
        >
          {packs.data.map((item) => {
            const id = `pack-${item.id}`;
            const active = item.id === selected;
            return (
              <Label
                key={item.id}
                htmlFor={id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 leading-normal font-normal hover:bg-card",
                  active && "bg-card",
                )}
              >
                <RadioGroupItem id={id} value={item.id} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {item.name}
                    {item.note === null ? null : <Badge>{item.note}</Badge>}
                  </span>
                  <span className="tabular flex items-center gap-1 text-xs text-muted-foreground">
                    <Coins aria-hidden="true" className="size-3" />
                    {formatCredits(item.credits)} credits
                  </span>
                </span>
                <span className="tabular shrink-0 text-sm">{item.price}</span>
              </Label>
            );
          })}
        </RadioGroup>
      )}

      <p className="text-xs text-muted-foreground">
        Sample checkout: payment methods are still being decided, so the pack is added at once.
        Failed generations are always refunded.
      </p>

      <DialogFooter>
        <Button variant="secondary" onClick={onDone}>
          Not now
        </Button>
        <Button
          disabled={pack === null || topUp.isPending}
          onClick={() => {
            if (pack === null) return;
            topUp.mutate(
              { packId: pack.id },
              {
                onSuccess: (next) => {
                  toast(
                    `Added ${formatCredits(pack.credits)} credits. You now have ${formatCredits(next.credits)}.`,
                    { icon: <Check aria-hidden="true" className="size-4" /> },
                  );
                  onDone();
                },
                onError: () => {
                  toast.error("The top up did not go through and nothing was charged. Try again.");
                },
              },
            );
          }}
        >
          {topUp.isPending
            ? "Adding credits…"
            : pack === null
              ? "Choose a pack"
              : `Add ${formatCredits(pack.credits)} credits`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
