"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronFirst,
  ChevronLast,
  Clapperboard,
  Coins,
  Columns2,
  Combine,
  Download,
  ListVideo,
  Palette,
  RefreshCw,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCredits } from "@/lib/format";
import { cn } from "@/lib/utils";

import { actionReason, isMedia, type ToolbarAction } from "../actions";
import { boardActionMutation } from "../mutations";
import { boardQuoteQuery } from "../queries";
import { PaidActionSchema, type BoardNode, type BoardQuote } from "../schema";
import { CompareDialog } from "./compare-dialog";

type ActionMeta = {
  readonly action: ToolbarAction;
  readonly label: string;
  readonly icon: LucideIcon;
};

const ACTIONS: readonly ActionMeta[] = [
  { action: "regenerate", label: "Regenerate", icon: RefreshCw },
  { action: "restyle", label: "Restyle to palette", icon: Palette },
  { action: "animate", label: "Animate between frames", icon: Clapperboard },
  { action: "use-first-frame", label: "Use as first frame", icon: ChevronFirst },
  { action: "use-last-frame", label: "Use as last frame", icon: ChevronLast },
  { action: "stitch", label: "Stitch", icon: Combine },
  { action: "send-to-timeline", label: "Send to timeline", icon: ListVideo },
  { action: "compare", label: "Compare", icon: Columns2 },
  { action: "download", label: "Download", icon: Download },
  { action: "delete", label: "Delete", icon: Trash },
];

function costOf(action: ToolbarAction, quote: BoardQuote | undefined): number | null {
  const paid = PaidActionSchema.safeParse(action);
  if (!paid.success || !quote) return null;
  return quote[paid.data];
}

/**
 * Floats over the canvas while something is selected. Desktop and tablet
 * only: on a phone the board is view and select (PRODUCT.md).
 */
export function SelectionToolbar({
  storyboardId,
  selected,
  onDone,
}: {
  readonly storyboardId: string;
  readonly selected: readonly BoardNode[];
  readonly onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const ids = selected.map((node) => node.id);
  const quote = useQuery(boardQuoteQuery(storyboardId, ids));
  const mutation = useMutation(boardActionMutation(queryClient, storyboardId));
  const [comparing, setComparing] = useState(false);

  if (selected.length === 0) return null;

  const run = (action: ToolbarAction) => {
    switch (action) {
      case "compare":
        setComparing(true);
        return;
      case "download":
        toast(
          `Downloads are not connected yet. ${String(selected.filter(isMedia).length)} selected.`,
        );
        return;
      case "regenerate":
      case "restyle":
      case "animate":
      case "use-first-frame":
      case "use-last-frame":
      case "stitch":
      case "send-to-timeline":
      case "delete":
        mutation.mutate(
          { action, nodeIds: ids },
          {
            onSuccess: (result) => {
              toast(result.message);
              if (action === "delete") onDone();
            },
            onError: () => {
              toast("That did not go through. The board is back as it was; try again.");
            },
          },
        );
    }
  };

  return (
    <>
      <div className="absolute top-2 left-1/2 z-10 -translate-x-1/2">
        <p
          aria-live="polite"
          className="rounded-full bg-popover px-3 py-2 text-xs font-medium shadow-overlay md:hidden"
        >
          {selected.length} selected. Edit on a larger screen.
        </p>
        <div
          role="toolbar"
          aria-label={`Actions for ${String(selected.length)} selected`}
          className="hidden items-center gap-0.5 rounded-full bg-popover p-0.5 shadow-overlay md:flex"
        >
          <span aria-live="polite" className="tabular px-2.5 text-xs font-medium whitespace-nowrap">
            {selected.length} selected
          </span>
          {ACTIONS.map(({ action, label, icon: Icon }) => {
            const reason = actionReason(action, selected);
            const cost = costOf(action, quote.data);
            const blocked = reason !== null || mutation.isPending;
            const name = [label, cost === null ? null : `${formatCredits(cost)} credits`, reason]
              .filter((part) => part !== null)
              .join(", ");
            return (
              <Tooltip key={action}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={name}
                    aria-disabled={blocked}
                    className={cn(
                      blocked && "opacity-45",
                      action === "delete" && !blocked && "hover:text-destructive-foreground",
                    )}
                    onClick={() => {
                      if (!blocked) run(action);
                    }}
                  >
                    <Icon aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  <span>{label}</span>
                  {cost === null ? null : (
                    <span className="tabular inline-flex items-center gap-1">
                      <Coins aria-hidden="true" className="size-3" /> {formatCredits(cost)}
                    </span>
                  )}
                  {reason === null ? null : <span className="opacity-80">{reason}</span>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
      <CompareDialog
        open={comparing}
        onOpenChange={setComparing}
        nodes={selected.filter(isMedia)}
      />
    </>
  );
}
