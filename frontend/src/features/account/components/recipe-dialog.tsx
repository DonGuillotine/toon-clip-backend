"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceField } from "@/features/export/components/fields";
import { recentStoryboardsQuery } from "@/features/storyboards/queries";
import { apiErrorDetail } from "@/lib/api/client";

import { useSubmitRecipe } from "../mutations";
import { SCOPE_LABELS } from "../recipe-labels";
import { RECIPE_SCOPES, type RecipeSubmission, RecipeSubmissionSchema } from "../schema";
import { FormField } from "./form-field";

/** Radix Select cannot hold an empty value, so "no linked work" has a name. */
const NO_WORK = "none";

/**
 * The form's own schema: the confirmation starts unticked, so it is a boolean
 * that must be ticked, rather than the wire schema's literal `true`.
 */
const RecipeDraftSchema = RecipeSubmissionSchema.extend({
  ownWork: z.boolean().refine((value) => value, "Confirm this is your own prompting work."),
});
type RecipeDraft = z.infer<typeof RecipeDraftSchema>;

export function RecipeDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <RecipeForm
          onDone={() => {
            onOpenChange(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

/**
 * Submit a recipe into review (spec 7.4): the prompt that worked, the steps
 * taken, notes, and the finished work it came from.
 */
function RecipeForm({ onDone }: { readonly onDone: () => void }) {
  const ownWorkId = useId();
  const submit = useSubmitRecipe();
  const storyboards = useQuery(recentStoryboardsQuery);
  const form = useForm<RecipeDraft>({
    resolver: zodResolver(RecipeDraftSchema),
    defaultValues: {
      title: "",
      scope: "camera",
      prompt: "",
      steps: "",
      notes: "",
      linkedWork: "",
      ownWork: false,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    // The draft schema has just proved the box is ticked.
    const submission: RecipeSubmission = { ...values, ownWork: true };
    submit.mutate(submission, {
      onSuccess: (recipe) => {
        toast(`"${recipe.title}" is in review. We let you know when it goes live.`);
        onDone();
      },
      onError: (error) => {
        toast.error(
          apiErrorDetail(error) ?? "The recipe did not send. Your draft is still here; try again.",
        );
      },
    });
  });

  return (
    <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Submit a recipe</DialogTitle>
        <DialogDescription>
          Share the prompt and steps behind a finished piece. It is reviewed before Magic Prompt
          uses it, and only the rules distilled from it are shown to others.
        </DialogDescription>
      </DialogHeader>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
      >
        <FormField label="Title" error={errors.title?.message}>
          {(props) => (
            <Input {...props} placeholder="Low angle hero entrance" {...form.register("title")} />
          )}
        </FormField>

        <div className="-mx-3">
          <Controller
            control={form.control}
            name="scope"
            render={({ field }) => (
              <ChoiceField
                label="What it improves"
                value={field.value}
                choices={RECIPE_SCOPES.map((value) => ({ value, label: SCOPE_LABELS[value] }))}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <FormField label="The prompt that worked" error={errors.prompt?.message}>
          {(props) => <Textarea {...props} rows={4} {...form.register("prompt")} />}
        </FormField>

        <FormField
          label="Steps you took"
          hint="One step per line, in order."
          error={errors.steps?.message}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              placeholder={"Start from the character sheet turnaround\nLock the camera low\n…"}
              {...form.register("steps")}
            />
          )}
        </FormField>

        <FormField
          label="Notes"
          hint="Optional. What to watch out for."
          error={errors.notes?.message}
        >
          {(props) => <Textarea {...props} rows={2} {...form.register("notes")} />}
        </FormField>

        <FormField
          label="Finished work"
          hint="Optional. The storyboard this recipe made."
          error={errors.linkedWork?.message}
        >
          {(props) => (
            <Controller
              control={form.control}
              name="linkedWork"
              render={({ field }) => (
                <Select
                  value={field.value === "" ? NO_WORK : field.value}
                  onValueChange={(next) => {
                    field.onChange(next === NO_WORK ? "" : next);
                  }}
                >
                  <SelectTrigger {...props} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_WORK}>None</SelectItem>
                    {(storyboards.data ?? []).map((storyboard) => (
                      <SelectItem key={storyboard.id} value={storyboard.id}>
                        {storyboard.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Controller
              control={form.control}
              name="ownWork"
              render={({ field }) => (
                <Checkbox
                  id={ownWorkId}
                  checked={field.value}
                  aria-invalid={errors.ownWork !== undefined}
                  onCheckedChange={(value) => {
                    field.onChange(value === true);
                  }}
                />
              )}
            />
            <Label htmlFor={ownWorkId} className="leading-normal font-normal">
              This is my own prompting work, with no copyrighted text or private data in it.
            </Label>
          </div>
          {errors.ownWork?.message === undefined ? null : (
            <p className="text-xs text-destructive-foreground">{errors.ownWork.message}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? "Sending…" : "Send to review"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
