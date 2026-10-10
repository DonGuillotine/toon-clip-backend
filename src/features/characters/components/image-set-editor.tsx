"use client";

import { ImagePlus, X } from "lucide-react";

import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePickButton } from "@/features/create/components/file-pick-button";

import { type SheetImage, type SheetSet } from "../schema";
import { labelFromFileName, SHEET_SET_META } from "../sheet";

import { SheetImageView } from "./sheet-image-view";

/** How many images each set may hold, matching the schema. */
const LIMIT = { turnarounds: 12, expressions: 24, outfits: 12 } satisfies Record<SheetSet, number>;

/**
 * One image set on a character sheet: add images, rename each one, remove
 * any. Uploads become object URLs on this device until the upload endpoint
 * exists (CONTRACT: unconfirmed).
 */
export function ImageSetEditor({
  set,
  images,
  readOnly,
  onChange,
  onUpload,
}: {
  readonly set: SheetSet;
  readonly images: readonly SheetImage[];
  readonly readOnly: boolean;
  readonly onChange: (images: SheetImage[]) => void;
  /** Turns a picked file into a preview URL the editor keeps track of. */
  readonly onUpload: (file: File) => string;
}) {
  const meta = SHEET_SET_META[set];
  const titleId = `sheet-${set}`;
  const room = LIMIT[set] - images.length;

  return (
    <Section
      title={meta.title}
      titleId={titleId}
      description={meta.hint}
      count={images.length}
      action={
        readOnly ? undefined : (
          <FilePickButton
            accept="image/*"
            multiple
            disabled={room <= 0}
            label={`Add ${meta.item} images`}
            className="h-8 px-3"
            onFiles={(files) => {
              const added = files.slice(0, Math.max(room, 0)).map((file): SheetImage => ({
                id: `img_${crypto.randomUUID()}`,
                label: labelFromFileName(file.name),
                source: { kind: "upload", fileName: file.name, url: onUpload(file) },
              }));
              onChange([...images, ...added]);
            }}
          >
            <ImagePlus aria-hidden="true" /> Add
          </FilePickButton>
        )
      }
    >
      {images.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">
          {readOnly
            ? `No ${meta.title.toLowerCase()} on this sheet.`
            : `No ${meta.title.toLowerCase()} yet. Add images so every shot keeps them on model.`}
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-1">
          {images.map((image, index) => (
            <li key={image.id} className="flex flex-col gap-1 rounded-sm bg-card p-1">
              <SheetImageView image={image} className="w-full" />
              <div className="flex items-center gap-1">
                <Input
                  aria-label={`Name of ${meta.item} ${String(index + 1)}`}
                  value={image.label}
                  maxLength={60}
                  readOnly={readOnly}
                  aria-invalid={image.label.trim() === ""}
                  className="h-8 min-w-0 flex-1 px-3 text-xs"
                  onChange={(event) => {
                    onChange(
                      images.map((item) =>
                        item.id === image.id ? { ...item, label: event.target.value } : item,
                      ),
                    );
                  }}
                />
                {readOnly ? null : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${image.label.trim() === "" ? meta.item : image.label}`}
                    onClick={() => {
                      onChange(images.filter((item) => item.id !== image.id));
                    }}
                  >
                    <X aria-hidden="true" />
                  </Button>
                )}
              </div>
              {image.source.kind === "placeholder" ? (
                <span className="px-2 pb-1 text-xs text-muted-foreground">Placeholder art</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
