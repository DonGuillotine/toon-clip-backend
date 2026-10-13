"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDuration } from "@/lib/format";

import { nameTaken } from "../collections";
import {
  type Collection,
  CollectionNameSchema,
  COLLECTION_NAME_MAX,
  type GalleryWork,
  type Visibility,
  VisibilitySchema,
  VISIBILITIES,
} from "../schema";
import { VISIBILITY_META } from "./visibility";

const NameFormSchema = z.object({
  name: CollectionNameSchema,
  visibility: VisibilitySchema,
});
type NameForm = z.infer<typeof NameFormSchema>;

type NameDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode: "create" | "rename";
  /** Existing collections, so a duplicate name is caught before it is sent. */
  readonly collections: readonly Collection[];
  /** The collection being renamed, or `null` when creating. */
  readonly collection: Collection | null;
  /** When creating from a tile, the work that goes in first. */
  readonly firstWorkTitle: string | null;
  readonly onSubmit: (values: { readonly name: string; readonly visibility: Visibility }) => void;
};

/** Create a collection, or rename one. One form, validated with the API's own schema. */
export function CollectionNameDialog(props: NameDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {/* Remount the form each time it opens, so it starts from the current name. */}
      {props.open ? <NameDialogBody {...props} /> : null}
    </Dialog>
  );
}

function NameDialogBody({
  onOpenChange,
  mode,
  collections,
  collection,
  firstWorkTitle,
  onSubmit,
}: NameDialogProps) {
  const nameId = useId();
  const errorId = useId();
  const visibilityId = useId();
  const form = useForm<NameForm>({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      name: collection?.name ?? "",
      visibility: collection?.visibility ?? "private",
    },
  });
  const nameError = form.formState.errors.name?.message;

  const submit = form.handleSubmit((values) => {
    if (nameTaken(collections, values.name, collection?.id ?? null)) {
      form.setError("name", { message: "Another collection already has that name." });
      return;
    }
    onSubmit(values);
    onOpenChange(false);
  });

  return (
    <DialogContent>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void submit(event);
        }}
        noValidate
      >
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New collection" : "Rename collection"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? firstWorkTitle === null
                ? "Group finished work to show it, pitch it, or come back to it."
                : `"${firstWorkTitle}" goes in first.`
              : "The work inside stays as it is."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor={nameId}>Name</Label>
          <Input
            id={nameId}
            autoComplete="off"
            maxLength={COLLECTION_NAME_MAX}
            placeholder="For example: Showreel"
            aria-invalid={nameError === undefined ? undefined : true}
            aria-describedby={nameError === undefined ? undefined : errorId}
            {...form.register("name")}
          />
          {nameError === undefined ? null : (
            <p id={errorId} className="text-sm text-destructive-foreground">
              {nameError}
            </p>
          )}
        </div>

        {mode === "create" ? (
          <div className="flex flex-col gap-2">
            <span id={visibilityId} className="text-sm font-medium">
              Who can see it
            </span>
            <Controller
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <RadioGroup
                  aria-labelledby={visibilityId}
                  value={field.value}
                  onValueChange={(value) => {
                    const parsed = VisibilitySchema.safeParse(value);
                    if (parsed.success) field.onChange(parsed.data);
                  }}
                >
                  {VISIBILITIES.map((visibility) => {
                    const meta = VISIBILITY_META[visibility];
                    const itemId = `${visibilityId}-${visibility}`;
                    return (
                      <div key={visibility} className="flex items-center gap-3 py-1">
                        <RadioGroupItem id={itemId} value={visibility} />
                        <Label htmlFor={itemId} className="flex-col items-start gap-0.5">
                          <span>{meta.label}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {meta.hint}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit">{mode === "create" ? "Create collection" : "Save name"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/** Deleting asks first. The work inside is never deleted, and the copy says so. */
export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  onConfirm,
}: {
  readonly collection: Collection;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}) {
  const count = collection.itemIds.length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Delete "${collection.name}"?`}</DialogTitle>
          <DialogDescription>
            {count === 0
              ? "The collection is empty."
              : `The ${String(count)} ${count === 1 ? "piece" : "pieces"} of work inside stay in your gallery.`}{" "}
            {collection.visibility === "public" ? "Its share link stops working." : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Keep it
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pick which finished work belongs in a collection. Each checkbox adds or
 * removes at once, so there is nothing to save and nothing to lose.
 */
export function AddWorkDialog({
  collection,
  works,
  open,
  onOpenChange,
  onToggle,
}: {
  readonly collection: Collection;
  readonly works: readonly GalleryWork[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onToggle: (itemId: string, included: boolean) => void;
}) {
  const baseId = useId();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{`Add work to "${collection.name}"`}</DialogTitle>
          <DialogDescription>
            Ticked work is in the collection. Changes save as you go.
          </DialogDescription>
        </DialogHeader>
        {works.length === 0 ? (
          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            Nothing is finished yet. Work shows up here once a shot or quick create result is ready.
          </p>
        ) : (
          <ul className="flex max-h-[min(60dvh,28rem)] flex-col gap-1 overflow-y-auto rounded-md bg-muted p-1">
            {works.map((work) => {
              const id = `${baseId}-${work.id}`;
              const included = collection.itemIds.includes(work.id);
              return (
                <li
                  key={work.id}
                  className="flex min-h-11 items-center gap-3 rounded-sm px-3 py-2 hover:bg-card"
                >
                  <Checkbox
                    id={id}
                    checked={included}
                    onCheckedChange={(value) => {
                      onToggle(work.id, value === true);
                    }}
                  />
                  <Label htmlFor={id} className="min-w-0 flex-1 flex-col items-start gap-0.5">
                    <span className="w-full truncate">{work.title}</span>
                    <span className="tabular text-xs font-normal text-muted-foreground">
                      {work.kind === "storyboard" ? "Storyboard" : "Quick create"} ·{" "}
                      {formatDuration(work.durationSec)}
                    </span>
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
