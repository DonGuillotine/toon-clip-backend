"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";

import { FieldError } from "@/components/form/field-error";
import { Button } from "@/components/ui/button";
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

import { normaliseHex } from "../library";
import { useDeskEdit } from "../mutations";
import { type Palette, type PaletteDraft, PaletteDraftSchema } from "../schema";

import { ConfirmDelete } from "./confirm-delete";
import { SwatchEditor } from "./swatch-editor";

const NEW_PALETTE: PaletteDraft = {
  name: "",
  swatches: [
    { hex: "#1b1b1f", role: "Line" },
    { hex: "#e9e4da", role: "Light" },
  ],
};

/** Create or edit a named colour set. `palette` is `null` for a new one. */
export function PaletteDialog({
  palette,
  open,
  onOpenChange,
}: {
  readonly palette: Palette | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* Keyed so switching palettes starts a fresh form. */}
        <PaletteForm
          key={palette?.id ?? "new"}
          palette={palette}
          onDone={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function PaletteForm({
  palette,
  onDone,
}: {
  readonly palette: Palette | null;
  readonly onDone: () => void;
}) {
  const nameId = useId();
  const edit = useDeskEdit();
  const form = useForm<PaletteDraft>({
    resolver: zodResolver(PaletteDraftSchema),
    defaultValues: palette ? { name: palette.name, swatches: palette.swatches } : NEW_PALETTE,
  });
  const { errors } = form.formState;
  const swatchError =
    errors.swatches?.message ??
    (errors.swatches === undefined ? undefined : "Every colour needs a #rrggbb hex.");

  const submit = form.handleSubmit((values) => {
    // Tidy every hex once more, in case a field was never blurred.
    const draft: PaletteDraft = {
      name: values.name,
      swatches: values.swatches.map((swatch) => ({
        hex: normaliseHex(swatch.hex) ?? swatch.hex,
        role: swatch.role,
      })),
    };
    edit.mutate(
      palette ? { kind: "updatePalette", id: palette.id, draft } : { kind: "createPalette", draft },
      { onSuccess: onDone },
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{palette ? `Edit ${palette.name}` : "New palette"}</DialogTitle>
        <DialogDescription>
          A named colour set. Characters can follow it, and the board can restyle shots to it.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          maxLength={40}
          aria-invalid={errors.name !== undefined}
          placeholder="For example: Harmattan haze"
          {...form.register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Colours</span>
        <Controller
          control={form.control}
          name="swatches"
          render={({ field }) => (
            <>
              <div aria-hidden="true" className="flex h-10 overflow-hidden rounded-sm bg-muted">
                {field.value.map((swatch, index) => {
                  const hex = normaliseHex(swatch.hex);
                  return hex === null ? null : (
                    <div
                      // Positional, like the rows below.
                      key={index}
                      className="flex-1"
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
              </div>
              <div className="rounded-md bg-muted p-1">
                <SwatchEditor
                  idPrefix={`palette-${palette?.id ?? "new"}`}
                  swatches={field.value}
                  showRoles
                  max={8}
                  onChange={field.onChange}
                />
              </div>
            </>
          )}
        />
        <FieldError message={swatchError} />
      </div>

      <DialogFooter className="sm:items-end">
        {palette ? (
          <ConfirmDelete
            noun="palette"
            consequence={`Delete ${palette.name}? Characters that follow it keep their colours.`}
            pending={edit.isPending}
            onConfirm={() => {
              edit.mutate({ kind: "deletePalette", id: palette.id }, { onSuccess: onDone });
            }}
          />
        ) : null}
        <Button onClick={() => void submit()} disabled={edit.isPending}>
          {palette ? "Save palette" : "Add palette"}
        </Button>
      </DialogFooter>
    </div>
  );
}
