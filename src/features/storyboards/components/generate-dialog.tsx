"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { accountQuery } from "@/features/account/queries";
import { formatCredits } from "@/lib/format";

import { shotQuoteQuery } from "../queries";
import { type GenerationKind } from "../schema";
import { CONFIRM_ABOVE_CREDITS } from "../timeline";

export type GenerateRequestState = {
  readonly shotId: string;
  readonly shotNumber: number;
  readonly kind: GenerationKind;
  readonly withNotes: boolean;
};

type Props = {
  readonly storyboardId: string;
  readonly request: GenerateRequestState | null;
  readonly onClose: () => void;
  readonly onConfirm: (input: { readonly notes: string | null; readonly credits: number }) => void;
};

/** Cost first, then commit. Above the threshold the spend is confirmed explicitly. */
export function GenerateDialog({ storyboardId, request, onClose, onConfirm }: Props) {
  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {request === null ? null : (
        <GenerateDialogBody
          // A fresh body per request, so a draft note never leaks between shots.
          key={`${request.shotId}-${request.kind}-${String(request.withNotes)}`}
          storyboardId={storyboardId}
          request={request}
          onConfirm={onConfirm}
        />
      )}
    </Dialog>
  );
}

function GenerateDialogBody({
  storyboardId,
  request,
  onConfirm,
}: {
  readonly storyboardId: string;
  readonly request: GenerateRequestState;
  readonly onConfirm: Props["onConfirm"];
}) {
  const notesId = useId();
  const confirmId = useId();
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const quote = useQuery(shotQuoteQuery(storyboardId, request.shotId, request.kind));
  const account = useQuery(accountQuery);

  const cost = quote.data?.credits ?? null;
  const balance = account.data?.credits ?? null;
  const short = cost !== null && balance !== null && cost > balance;
  const needsConfirm = cost !== null && cost > CONFIRM_ABOVE_CREDITS;
  const ready = cost !== null && !short && (!needsConfirm || confirmed);
  const continuing = request.kind === "continue";

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {continuing
            ? `Continue from shot ${String(request.shotNumber)}`
            : `Regenerate shot ${String(request.shotNumber)}`}
        </DialogTitle>
        <DialogDescription>
          {continuing
            ? "A new shot starts from this shot's last frame."
            : "A new take is made. Older takes are kept."}
        </DialogDescription>
      </DialogHeader>

      {request.withNotes ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={notesId}>What should change?</Label>
          <Textarea
            id={notesId}
            value={notes}
            placeholder="For example: the hand looks wrong"
            onChange={(event) => {
              setNotes(event.target.value);
            }}
          />
        </div>
      ) : null}

      <div aria-live="polite" className="flex flex-col gap-2 rounded-md bg-muted p-3">
        {quote.isPending ? (
          <Skeleton className="h-5 w-40" />
        ) : quote.isError ? (
          <div className="flex items-center justify-between gap-2">
            <p>The cost did not load.</p>
            <Button size="sm" variant="secondary" onClick={() => void quote.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <p className="tabular flex items-center gap-1.5">
            <Coins aria-hidden="true" className="size-4 text-muted-foreground" />
            This costs {formatCredits(quote.data.credits)} credits.
            {balance === null ? null : ` You have ${formatCredits(balance)}.`}
          </p>
        )}
        {short ? (
          <p className="text-destructive-foreground">
            Not enough credits for this. Top up, or pick a shorter shot.
          </p>
        ) : null}
        {needsConfirm && !short ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={confirmId}
              checked={confirmed}
              onCheckedChange={(value) => {
                setConfirmed(value === true);
              }}
            />
            <Label htmlFor={confirmId}>
              Spend {formatCredits(cost)} credits. Failed generations are refunded.
            </Label>
          </div>
        ) : null}
      </div>

      <DialogFooter>
        <Button
          disabled={!ready}
          onClick={() => {
            if (cost === null) return;
            const trimmed = notes.trim();
            onConfirm({ notes: trimmed === "" ? null : trimmed, credits: cost });
          }}
        >
          {continuing ? "Generate shot" : "Regenerate"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
