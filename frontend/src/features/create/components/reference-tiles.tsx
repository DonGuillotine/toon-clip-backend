"use client";

import { AtSign, Film, Image as ImageIcon, Music, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import { type Reference, remaining } from "../references";
import { REFERENCE_LIMITS, type ReferenceKind } from "../schema";
import { FilePickButton } from "./file-pick-button";

const KIND_META = {
  image: { label: "image", plural: "images", accept: "image/*", icon: ImageIcon },
  video: { label: "video", plural: "videos", accept: "video/*", icon: Film },
  audio: { label: "audio clip", plural: "audio clips", accept: "audio/*", icon: Music },
} satisfies Record<
  ReferenceKind,
  { label: string; plural: string; accept: string; icon: typeof ImageIcon }
>;

/**
 * Upload tiles above the prompt (spec 7.2, Reference mode). Each attached file
 * gets a tag such as `@image1`; pressing the tag writes it into the prompt.
 */
export function ReferenceTiles({
  kinds,
  references,
  onAdd,
  onRemove,
  onTag,
}: {
  readonly kinds: readonly ReferenceKind[];
  readonly references: readonly Reference[];
  readonly onAdd: (kind: ReferenceKind, files: readonly File[]) => void;
  readonly onRemove: (reference: Reference) => void;
  readonly onTag: (tag: string) => void;
}) {
  const attached = references.filter((reference) => kinds.includes(reference.kind));
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        {kinds.map((kind) => {
          const meta = KIND_META[kind];
          const Icon = meta.icon;
          const left = remaining(references, kind);
          return (
            <FilePickButton
              key={kind}
              accept={meta.accept}
              multiple
              disabled={left === 0}
              onFiles={(files) => {
                onAdd(kind, files);
              }}
              className="h-11 justify-start rounded-sm bg-card px-3 hover:bg-card"
            >
              <Icon aria-hidden="true" />
              <span>Add {meta.label}</span>
              <span className="tabular ms-auto text-xs text-muted-foreground">
                {left === 0 ? "Full" : `${String(left)} of ${String(REFERENCE_LIMITS[kind])} left`}
              </span>
            </FilePickButton>
          );
        })}
      </div>

      {attached.length === 0 ? (
        <p className="px-2 py-1 text-xs text-muted-foreground">
          Add {kinds.map((kind) => KIND_META[kind].plural).join(", ")} to guide the result, then
          type their @tag in the prompt.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4" aria-label="Attached references">
          {attached.map((reference) => (
            <li key={reference.id} className="flex flex-col gap-1 rounded-sm bg-card p-1">
              <ReferencePreview reference={reference} />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-w-0 flex-1 justify-start px-2"
                  aria-label={`Insert ${reference.tag} into the prompt`}
                  title={reference.name}
                  onClick={() => {
                    onTag(reference.tag);
                  }}
                >
                  <AtSign aria-hidden="true" />
                  <span className="truncate">{reference.tag.slice(1)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${reference.tag}`}
                  onClick={() => {
                    onRemove(reference);
                  }}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReferencePreview({ reference }: { readonly reference: Reference }) {
  switch (reference.kind) {
    case "image":
      return (
        <div className="relative aspect-video overflow-hidden rounded-xs bg-muted">
          <Image
            src={reference.url}
            alt={reference.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      );
    case "video":
    case "audio": {
      const Icon = KIND_META[reference.kind].icon;
      return (
        <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-xs bg-muted p-1 text-muted-foreground">
          <Icon aria-hidden="true" className="size-5" />
          <span className="max-w-full truncate px-1 text-xs">{reference.name}</span>
        </div>
      );
    }
  }
}
