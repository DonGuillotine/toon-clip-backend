"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Copy, Lock, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { MarginNote } from "@/components/comic/margin-note";
import { FieldError } from "@/components/form/field-error";
import { OptionMenu } from "@/components/form/option-menu";
import { Card, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { SwatchEditor } from "@/features/desk/components/swatch-editor";
import { normaliseHex } from "@/features/desk/library";
import { deskLibraryQuery } from "@/features/desk/queries";
import { ApiError } from "@/lib/api/client";

import {
  useCreateCharacter,
  useDeleteCharacter,
  useDuplicateCharacter,
  useSaveCharacter,
} from "../mutations";
import { characterQuery } from "../queries";
import {
  type CharacterDraft,
  CharacterDraftSchema,
  type CharacterSheet,
  type CharacterSummary,
  hasUploads,
  SHEET_SETS,
} from "../schema";
import { draftFromSheet, emptyDraft, STARTER_PALETTE } from "../sheet";

import { DeleteCharacterDialog } from "./delete-character-dialog";
import { ImageSetEditor } from "./image-set-editor";
import { Portrait } from "./portrait";

/** The palette menu value for colours that follow no desk palette. */
const OWN_COLOURS = "own";

/**
 * The character sheet editor (spec 6, "Character sheet"): name, look, notes,
 * voice, palette, and the turnaround, expression and outfit images. `id` is
 * `null` on /characters/new.
 */
export function CharacterEditor({ id }: { readonly id: string | null }) {
  if (id === null) return <SheetForm sheet={null} />;
  return <ExistingSheet id={id} />;
}

function ExistingSheet({ id }: { readonly id: string }) {
  const query = useQuery(characterQuery(id));

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading the sheet">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <Card className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl">
            {missing ? "That character is not in your cast." : "The sheet did not load."}
          </h1>
          <p className="text-muted-foreground">
            {missing
              ? "It may have been deleted. Your other characters are on the desk."
              : "Check your connection and try again. Nothing on the sheet was lost."}
          </p>
        </div>
        <div className="flex gap-2">
          {missing ? null : <Button onClick={() => void query.refetch()}>Try again</Button>}
          <Button asChild variant="secondary">
            <Link href="/desk">Open the desk</Link>
          </Button>
        </div>
      </Card>
    );
  }
  // Keyed on the id so moving between sheets starts a fresh form.
  return <SheetForm key={query.data.id} sheet={query.data} />;
}

/** A Portrait needs a summary; this one follows the form as the creator types. */
function previewSummary(draft: CharacterDraft, sheet: CharacterSheet | null): CharacterSummary {
  const palette = draft.palette.flatMap((hex) => {
    const valid = normaliseHex(hex);
    return valid === null ? [] : [valid];
  });
  return {
    id: sheet?.id ?? "new",
    name: draft.name.trim() === "" ? "?" : draft.name,
    look: draft.look,
    palette: palette.length > 0 ? palette : [...STARTER_PALETTE],
    outfitCount: draft.outfits.length,
    expressionCount: draft.expressions.length,
    isSample: sheet?.isSample ?? false,
  };
}

function SheetForm({ sheet }: { readonly sheet: CharacterSheet | null }) {
  const router = useRouter();
  const nameId = useId();
  const lookId = useId();
  const notesId = useId();
  const voiceId = useId();
  const rightsId = useId();

  const readOnly = sheet?.isSample === true;
  const library = useQuery(deskLibraryQuery);
  const create = useCreateCharacter();
  const save = useSaveCharacter(sheet?.id ?? "new");
  const remove = useDeleteCharacter();
  const duplicate = useDuplicateCharacter();

  const form = useForm<CharacterDraft>({
    resolver: zodResolver(CharacterDraftSchema),
    defaultValues: sheet ? draftFromSheet(sheet) : emptyDraft(),
  });
  const { errors, isDirty } = form.formState;
  // Subscribe to every field so the header, portrait and rights notice follow edits.
  useWatch({ control: form.control });
  const values = form.getValues();
  const uploads = hasUploads(values);
  const preview = previewSummary(values, sheet);
  const pending = create.isPending || save.isPending;

  // Uploaded previews are object URLs on this device. They are not revoked
  // here: a saved sheet keeps pointing at them until the upload endpoint
  // exists (CONTRACT: unconfirmed).
  const toPreviewUrl = (file: File) => URL.createObjectURL(file);

  const submit = form.handleSubmit((next) => {
    const tidy: CharacterDraft = {
      ...next,
      palette: next.palette.map((hex) => normaliseHex(hex) ?? hex),
    };
    if (sheet === null) {
      create.mutate(tidy, {
        onSuccess: (saved) => {
          form.reset(draftFromSheet(saved));
          router.replace(`/characters/${saved.id}`);
        },
      });
      return;
    }
    save.mutate(tidy, {
      onSuccess: (saved) => {
        form.reset(draftFromSheet(saved));
      },
    });
  });

  const palettes = library.data?.palettes ?? [];
  const linked = palettes.find((palette) => palette.id === values.paletteId) ?? null;

  return (
    <div
      role="form"
      className="flex flex-col gap-4 md:gap-8"
      aria-label={sheet ? `Character sheet for ${sheet.name}` : "New character sheet"}
    >
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Portrait character={preview} className="size-16" />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="flex items-center gap-2 truncate font-display text-4xl md:text-5xl">
              {sheet === null && values.name.trim() === "" ? "New character" : preview.name}
              {readOnly ? <Badge>Sample</Badge> : null}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {String(values.turnarounds.length)} turnarounds, {String(values.expressions.length)}{" "}
              expressions, {String(values.outfits.length)} outfits
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sheet === null ? null : (
            <Button
              variant={readOnly ? "default" : "secondary"}
              disabled={duplicate.isPending}
              onClick={() => {
                duplicate.mutate(sheet.id, {
                  onSuccess: (copy) => {
                    router.push(`/characters/${copy.id}`);
                  },
                });
              }}
            >
              <Copy aria-hidden="true" /> Duplicate
            </Button>
          )}
          {sheet === null || readOnly ? null : (
            <DeleteCharacterDialog
              name={sheet.name}
              pending={remove.isPending}
              onConfirm={() => {
                remove.mutate(sheet.id, {
                  onSuccess: () => {
                    router.push("/desk");
                  },
                });
              }}
            />
          )}
          {readOnly ? null : (
            <Button
              onClick={() => void submit()}
              disabled={pending || (sheet !== null && !isDirty)}
            >
              <Save aria-hidden="true" />
              {sheet === null ? "Create character" : isDirty ? "Save changes" : "Saved"}
            </Button>
          )}
        </div>
      </Card>

      {readOnly ? (
        <Card className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm">
            <Lock aria-hidden="true" className="size-4 text-muted-foreground" />
            {sheet.name} is sample content from the tour, so the sheet is read-only. Duplicate it to
            make a version you can change.
          </p>
          <MarginNote>Sample content</MarginNote>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 md:gap-8 lg:col-span-5">
          <Section title="Sheet" titleId="sheet-basics" well={false}>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={nameId}>Name</Label>
                <Input
                  id={nameId}
                  maxLength={40}
                  readOnly={readOnly}
                  aria-invalid={errors.name !== undefined}
                  placeholder="For example: Adaeze"
                  {...form.register("name")}
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={lookId}>Look</Label>
                <Input
                  id={lookId}
                  maxLength={120}
                  readOnly={readOnly}
                  placeholder="One line: hair, clothes, one thing you would spot"
                  {...form.register("look")}
                />
                <FieldError message={errors.look?.message} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={voiceId}>Voice</Label>
                <Input
                  id={voiceId}
                  maxLength={200}
                  readOnly={readOnly}
                  placeholder="A voice from your library, or a link"
                  {...form.register("voice")}
                />
                <p className="text-xs text-muted-foreground">
                  Used when shots have dialogue. Leave empty for a silent character.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={notesId}>Notes</Label>
                <Textarea
                  id={notesId}
                  maxLength={2000}
                  readOnly={readOnly}
                  placeholder="What Magic Prompt should always keep: props, habits, what never changes."
                  {...form.register("notes")}
                />
                <p className="text-xs text-muted-foreground">
                  The sheet is the truth: these notes override loose wording in a prompt.
                </p>
              </div>
            </div>
          </Section>

          <Section
            title="Palette"
            titleId="sheet-palette"
            description={
              linked
                ? `Following ${linked.name} from the desk.`
                : "Own colours. Pick a desk palette to follow one instead."
            }
            action={
              readOnly ? undefined : (
                <OptionMenu
                  label="Palette"
                  value={values.paletteId ?? OWN_COLOURS}
                  options={[
                    { value: OWN_COLOURS, label: "Own colours" },
                    ...palettes.map((palette) => ({ value: palette.id, label: palette.name })),
                  ]}
                  onChange={(next) => {
                    if (next === OWN_COLOURS) {
                      form.setValue("paletteId", null, { shouldDirty: true });
                      return;
                    }
                    const palette = palettes.find((candidate) => candidate.id === next);
                    if (!palette) return;
                    form.setValue("paletteId", palette.id, { shouldDirty: true });
                    form.setValue(
                      "palette",
                      palette.swatches.slice(0, 6).map((swatch) => swatch.hex),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                />
              )
            }
          >
            <Controller
              control={form.control}
              name="palette"
              render={({ field }) => (
                <SwatchEditor
                  idPrefix="character-palette"
                  swatches={field.value.map((hex) => ({ hex, role: "" }))}
                  showRoles={false}
                  max={6}
                  disabled={readOnly}
                  onChange={(next) => {
                    field.onChange(next.map((swatch) => swatch.hex));
                    // Editing a colour by hand stops following the desk palette.
                    if (form.getValues("paletteId") !== null) {
                      form.setValue("paletteId", null, { shouldDirty: true });
                    }
                  }}
                />
              )}
            />
            <div className="px-2 pb-1">
              <FieldError
                message={
                  errors.palette?.message ??
                  (errors.palette === undefined ? undefined : "Every colour needs a #rrggbb hex.")
                }
              />
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-4 md:gap-8 lg:col-span-7">
          {SHEET_SETS.map((set) => (
            <Controller
              key={set}
              control={form.control}
              name={set}
              render={({ field }) => (
                <ImageSetEditor
                  set={set}
                  images={field.value}
                  readOnly={readOnly}
                  onChange={field.onChange}
                  onUpload={toPreviewUrl}
                />
              )}
            />
          ))}
          {SHEET_SETS.some((set) => errors[set] !== undefined) ? (
            <FieldError message="Every image needs a name." />
          ) : null}
        </div>
      </div>

      {uploads && !readOnly ? (
        <Card className="flex flex-col gap-2 p-4">
          <Controller
            control={form.control}
            name="rightsConfirmed"
            render={({ field }) => (
              <div className="flex items-start gap-3">
                <Checkbox
                  id={rightsId}
                  checked={field.value}
                  aria-invalid={errors.rightsConfirmed !== undefined}
                  className="mt-0.5"
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                  }}
                />
                <Label htmlFor={rightsId} className="leading-snug font-normal">
                  I have the right to use every image I uploaded to this sheet, and none shows a
                  real person without their permission.
                </Label>
              </div>
            )}
          />
          <FieldError message={errors.rightsConfirmed?.message} />
        </Card>
      ) : null}
    </div>
  );
}
