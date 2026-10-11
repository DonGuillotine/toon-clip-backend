"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCredits } from "@/lib/format";

import { balanceQuery } from "../queries";
import { useBuyCreditsStore } from "../stores";

/** The wallet code loads when the dialog first opens, not with every page. */
const BuyFlow = dynamic(() => import("./buy-flow"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-2" aria-busy="true">
      <Skeleton className="h-16 rounded-md" />
      <Skeleton className="h-11 rounded-md" />
    </div>
  ),
});

/**
 * The one buy-credits dialog, mounted in the shell. Every "Buy credits"
 * button and short-balance notice opens it through the store.
 */
export function BuyCreditsDialog() {
  const open = useBuyCreditsStore((state) => state.open);
  const setOpen = useBuyCreditsStore((state) => state.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {open ? (
        <DialogContent className="sm:max-w-md">
          <BuyHeader />
          <BuyFlow
            onDone={() => {
              setOpen(false);
            }}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function BuyHeader() {
  const needed = useBuyCreditsStore((state) => state.needed);
  const balance = useQuery(balanceQuery);
  const short =
    needed === null || balance.data === undefined
      ? null
      : Math.max(0, needed - balance.data.balance);

  return (
    <DialogHeader>
      <DialogTitle>Buy credits</DialogTitle>
      <DialogDescription aria-live="polite">
        {balance.data === undefined
          ? "Credits pay for projects, revisions and exports."
          : `You have ${formatCredits(balance.data.balance)} credits.`}
        {short !== null && short > 0 ? ` That needs ${formatCredits(short)} more.` : null}
      </DialogDescription>
    </DialogHeader>
  );
}
