"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceField } from "@/features/export/components/fields";

import { useSendFeedback } from "../mutations";
import { FEEDBACK_TOPICS, type Feedback, FeedbackSchema, type FeedbackTopic } from "../schema";

const TOPIC_LABELS = {
  idea: "An idea",
  problem: "Something broke",
  praise: "Something I liked",
} satisfies Record<FeedbackTopic, string>;

const TOPIC_CHOICES = FEEDBACK_TOPICS.map((value) => ({ value, label: TOPIC_LABELS[value] }));

/** Send feedback from the profile menu. Opened and closed by its parent. */
export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <FeedbackForm
          onDone={() => {
            onOpenChange(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function FeedbackForm({ onDone }: { readonly onDone: () => void }) {
  const messageId = useId();
  const errorId = useId();
  const send = useSendFeedback();
  const form = useForm<Feedback>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: { topic: "idea", message: "" },
  });
  const messageError = form.formState.errors.message?.message;

  const onSubmit = form.handleSubmit((values) => {
    send.mutate(values, {
      onSuccess: () => {
        toast("Thanks. Your feedback reached the Toon Clip team.");
        onDone();
      },
      onError: () => {
        toast.error("Your feedback did not send. It is still here; try again.");
      },
    });
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Send feedback</DialogTitle>
        <DialogDescription>
          Tell the team what to fix or build next. We read every message.
        </DialogDescription>
      </DialogHeader>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
      >
        <div className="-mx-3">
          <Controller
            control={form.control}
            name="topic"
            render={({ field }) => (
              <ChoiceField
                label="What is it about?"
                value={field.value}
                choices={TOPIC_CHOICES}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={messageId}>Message</Label>
          <Textarea
            id={messageId}
            rows={5}
            placeholder="For example: I want to drag a frame from the board into Quick create."
            aria-invalid={messageError !== undefined}
            aria-describedby={messageError === undefined ? undefined : errorId}
            {...form.register("message")}
          />
          {messageError === undefined ? null : (
            <p id={errorId} className="text-xs text-destructive-foreground">
              {messageError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={send.isPending}>
            {send.isPending ? "Sending…" : "Send feedback"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
