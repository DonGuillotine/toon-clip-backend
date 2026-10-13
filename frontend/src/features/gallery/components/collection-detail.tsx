"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ArrowLeft, Link2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Card, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { shareUrl, worksIn } from "../collections";
import { useGalleryAction } from "../mutations";
import { type Collection, type Gallery, VisibilitySchema, VISIBILITIES } from "../schema";
import { AddWorkDialog, CollectionNameDialog, DeleteCollectionDialog } from "./collection-dialogs";
import { VISIBILITY_META } from "./visibility";
import { WorkTile } from "./work-tile";

type OpenDialog = "rename" | "delete" | "add" | null;

/** One collection: its work, who can see it, and the share link. */
export function CollectionDetail({
  gallery,
  collection,
  onClose,
}: {
  readonly gallery: Gallery;
  readonly collection: Collection;
  readonly onClose: () => void;
}) {
  const action = useGalleryAction();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const works = worksIn(collection, gallery.works);
  const pending = collection.id.startsWith("pending_");
  const meta = VISIBILITY_META[collection.visibility];

  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null);
  };

  const copyLink = async () => {
    const url = shareUrl(window.location.origin, collection.id);
    try {
      await navigator.clipboard.writeText(url);
      toast(
        collection.visibility === "public"
          ? "Link copied. Anyone with it can watch this collection."
          : "Link copied. The collection is private, so only you can open it.",
      );
    } catch {
      toast.error(`The link could not be copied. Copy it by hand: ${url}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <div>
          <Button variant="ghost" size="sm" onClick={onClose} className="-ms-2">
            <ArrowLeft aria-hidden="true" /> All collections
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate font-display text-3xl">{collection.name}</h2>
            <p className="tabular text-sm text-muted-foreground">
              {works.length} {works.length === 1 ? "piece" : "pieces"} · updated{" "}
              {formatDistanceToNowStrict(new Date(collection.updatedAt), { addSuffix: true })}
            </p>
            {collection.description === "" ? null : (
              <p className="max-w-prose text-sm">{collection.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                setDialog("rename");
              }}
            >
              <Pencil aria-hidden="true" /> Rename
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => void copyLink()}
            >
              <Link2 aria-hidden="true" /> Copy share link
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                setDialog("delete");
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted p-3 ps-4">
          <span id="collection-visibility" className="text-sm font-medium">
            Who can see it
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            variant="outline"
            value={collection.visibility}
            disabled={pending}
            aria-labelledby="collection-visibility"
            onValueChange={(next) => {
              const parsed = VisibilitySchema.safeParse(next);
              if (!parsed.success || parsed.data === collection.visibility) return;
              action.mutate(
                { type: "setVisibility", collectionId: collection.id, visibility: parsed.data },
                {
                  onSuccess: () => {
                    toast(
                      parsed.data === "public"
                        ? "Public. Anyone with the link can watch it."
                        : "Private. Only you can open it now.",
                    );
                  },
                },
              );
            }}
          >
            {VISIBILITIES.map((visibility) => {
              const Icon = VISIBILITY_META[visibility].icon;
              return (
                <ToggleGroupItem key={visibility} value={visibility}>
                  <Icon aria-hidden="true" /> {VISIBILITY_META[visibility].label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {meta.hint}
          </span>
        </div>
      </Card>

      <Section
        title="Work in this collection"
        titleId="collection-works"
        count={works.length}
        action={
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              setDialog("add");
            }}
          >
            <Plus aria-hidden="true" /> Add work
          </Button>
        }
      >
        {works.length === 0 ? (
          <div className="flex flex-col items-start gap-3 p-3">
            <p className="text-sm">
              This collection is empty. Add finished storyboards or quick create results to it.
            </p>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setDialog("add");
              }}
            >
              Choose work
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            {works.map((work) => (
              <WorkTile
                key={work.id}
                work={work}
                action={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove "${work.title}" from ${collection.name}`}
                    onClick={() => {
                      action.mutate(
                        { type: "removeItem", collectionId: collection.id, itemId: work.id },
                        {
                          onSuccess: () => {
                            toast(
                              `Removed from "${collection.name}". It is still in your gallery.`,
                              {
                                action: {
                                  label: "Undo",
                                  onClick: () => {
                                    action.mutate({
                                      type: "addItem",
                                      collectionId: collection.id,
                                      itemId: work.id,
                                    });
                                  },
                                },
                              },
                            );
                          },
                        },
                      );
                    }}
                  >
                    <X />
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </Section>

      <CollectionNameDialog
        open={dialog === "rename"}
        onOpenChange={closeDialog}
        mode="rename"
        collections={gallery.collections}
        collection={collection}
        firstWorkTitle={null}
        onSubmit={({ name }) => {
          action.mutate({ type: "rename", collectionId: collection.id, name });
        }}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={dialog === "delete"}
        onOpenChange={closeDialog}
        onConfirm={() => {
          const name = collection.name;
          onClose();
          action.mutate(
            { type: "delete", collectionId: collection.id },
            {
              onSuccess: () => {
                toast(`"${name}" deleted. Its work is still in your gallery.`);
              },
            },
          );
        }}
      />
      <AddWorkDialog
        collection={collection}
        works={gallery.works}
        open={dialog === "add"}
        onOpenChange={closeDialog}
        onToggle={(itemId, included) => {
          action.mutate(
            included
              ? { type: "addItem", collectionId: collection.id, itemId }
              : { type: "removeItem", collectionId: collection.id, itemId },
          );
        }}
      />
    </div>
  );
}
