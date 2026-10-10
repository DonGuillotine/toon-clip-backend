"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";

import { CoverArt } from "@/components/comic/cover-art";
import { FieldError } from "@/components/form/field-error";
import { OptionMenu } from "@/components/form/option-menu";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type CoverArt as CoverArtKind, CoverArtSchema } from "@/features/storyboards/schema";
import { cn } from "@/lib/utils";

import { useDeskEdit } from "../mutations";
import {
  type RecipeRef,
  type StylePresetDraft,
  StylePresetDraftSchema,
  type StylePresetSummary,
} from "../schema";

import { ConfirmDelete } from "./confirm-delete";

/** What each reference look is called, for the picker's accessible names. */
const ART_LABEL = {
  burst: "Impact burst",
  rush: "Speed rush",
  dusk: "Warm dusk",
  rain: "Ink rain",
} satisfies Record<CoverArtKind, string>;

const NO_RECIPE = "none";

const NEW_STYLE: StylePresetDraft = {
  name: "",
  description: "",
  art: "burst",
  recipeId: null,
  isDefault: false,
};

/** Create or edit a named look. `style` is `null` for a new one. */
export function StyleDialog({
  style,
  recipes,
  open,
  onOpenChange,
}: {
  readonly style: StylePresetSummary | null;
  readonly recipes: readonly RecipeRef[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <StyleForm
          key={style?.id ?? "new"}
          style={style}
          recipes={recipes}
          onDone={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function StyleForm({
  style,
  recipes,
  onDone,
}: {
  readonly style: StylePresetSummary | null;
  readonly recipes: readonly RecipeRef[];
  readonly onDone: () => void;
}) {
  const nameId = useId();
  const descriptionId = useId();
  const artId = useId();
  const defaultId = useId();
  const edit = useDeskEdit();
  const form = useForm<StylePresetDraft>({
    resolver: zodResolver(StylePresetDraftSchema),
    defaultValues: style
      ? {
          name: style.name,
          description: style.description,
          art: style.art,
          recipeId: style.recipeId,
          isDefault: style.isDefault,
        }
      : NEW_STYLE,
  });
  const { errors } = form.formState;
  // The default can be moved to another style but never switched off here.
  const lockedDefault = style?.isDefault === true;

  const submit = form.handleSubmit((draft) => {
    edit.mutate(
      style ? { kind: "updateStyle", id: style.id, draft } : { kind: "createStyle", draft },
      { onSuccess: onDone },
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{style ? `Edit ${style.name}` : "New style"}</DialogTitle>
        <DialogDescription>
          A named look. Storyboards start on the default style, and Magic Prompt follows the linked
          recipe.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          maxLength={40}
          aria-invalid={errors.name !== undefined}
          placeholder="For example: Mafiki"
          {...form.register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={descriptionId}>Description</Label>
        <Textarea
          id={descriptionId}
          maxLength={160}
          placeholder="Line, light and colour in one sentence."
          {...form.register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <span id={artId} className="text-sm font-medium">
          Reference look
        </span>
        <Controller
          control={form.control}
          name="art"
          render={({ field }) => (
            <ToggleGroup
              type="single"
              aria-labelledby={artId}
              value={field.value}
              onValueChange={(next) => {
                const parsed = CoverArtSchema.safeParse(next);
                if (parsed.success) field.onChange(parsed.data);
              }}
              className="grid grid-cols-2 gap-1 sm:grid-cols-4"
            >
              {CoverArtSchema.options.map((art) => (
                <ToggleGroupItem
                  key={art}
                  value={art}
                  aria-label={ART_LABEL[art]}
                  className={cn(
                    "h-auto flex-col items-stretch gap-1 rounded-sm p-1",
                    "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
                  )}
                >
                  <span className="block h-12.5 overflow-hidden rounded-xs">
                    <CoverArt art={art} sfx={null} className="h-50 w-80 origin-top-left scale-25" />
                  </span>
                  <span className="text-xs">{ART_LABEL[art]}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Linked recipe</span>
          <p className="text-xs text-muted-foreground">
            The craft rules Magic Prompt applies for this look.
          </p>
        </div>
        <Controller
          control={form.control}
          name="recipeId"
          render={({ field }) => (
            <OptionMenu
              label="Linked recipe"
              value={field.value ?? NO_RECIPE}
              options={[
                { value: NO_RECIPE, label: "No recipe" },
                ...recipes.map((recipe) => ({
                  value: recipe.id,
                  label: `${recipe.name} v${String(recipe.version)}`,
                })),
              ]}
              onChange={(next) => {
                field.onChange(next === NO_RECIPE ? null : next);
              }}
            />
          )}
        />
      </div>

      <Controller
        control={form.control}
        name="isDefault"
        render={({ field }) => (
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor={defaultId}>Default style</Label>
              <p className="text-xs text-muted-foreground">
                {lockedDefault
                  ? "This is the default. Make another style the default to change it."
                  : "New storyboards start on this look. It replaces the current default."}
              </p>
            </div>
            <Switch
              id={defaultId}
              checked={field.value}
              disabled={lockedDefault}
              onCheckedChange={field.onChange}
            />
          </div>
        )}
      />

      <DialogFooter className="sm:items-end">
        {style ? (
          <ConfirmDelete
            noun="style"
            consequence={
              style.isDefault
                ? `Delete ${style.name}? The next style becomes the default.`
                : `Delete ${style.name}? Storyboards already made keep their look.`
            }
            pending={edit.isPending}
            onConfirm={() => {
              edit.mutate({ kind: "deleteStyle", id: style.id }, { onSuccess: onDone });
            }}
          />
        ) : null}
        <Button onClick={() => void submit()} disabled={edit.isPending}>
          {style ? "Save style" : "Add style"}
        </Button>
      </DialogFooter>
    </div>
  );
}
