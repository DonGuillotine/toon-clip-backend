"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderPlus, ListPlus, Plus } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

import { CoverArt } from "@/components/comic/cover-art";
import { Card, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { worksIn } from "../collections";
import { useGalleryAction } from "../mutations";
import { galleryQuery } from "../queries";
import { type Collection, type Gallery, type GalleryWork } from "../schema";
import { CollectionDetail } from "./collection-detail";
import { CollectionNameDialog } from "./collection-dialogs";
import { VisibilityBadge } from "./visibility";
import { WorkTile } from "./work-tile";

/**
 * Gallery (spec section 5): show and curate work in collections. The open
 * collection lives in the URL (`?collection=`), so a pasted link reopens it.
 */
export function GalleryView() {
  const [collectionId, setCollectionId] = useQueryState("collection", parseAsString);
  const gallery = useQuery(galleryQuery);

  if (gallery.isPending) {
    return (
      <div
        className="flex flex-col gap-4 md:gap-8"
        aria-busy="true"
        aria-label="Loading the gallery"
      >
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (gallery.isError) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm">The gallery did not load.</p>
        <Button variant="secondary" onClick={() => void gallery.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (collectionId !== null) {
    const collection = gallery.data.collections.find((candidate) => candidate.id === collectionId);
    if (!collection) {
      return (
        <Card className="flex flex-col items-start gap-3 p-6 sm:p-8">
          <h2 className="font-display text-2xl">That collection is not here.</h2>
          <p className="text-sm text-muted-foreground">
            It may have been deleted, or the link is old. Your other collections are in the gallery.
          </p>
          <Button variant="secondary" onClick={() => void setCollectionId(null)}>
            Back to the gallery
          </Button>
        </Card>
      );
    }
    return (
      <CollectionDetail
        gallery={gallery.data}
        collection={collection}
        onClose={() => void setCollectionId(null)}
      />
    );
  }

  return <Overview gallery={gallery.data} onOpen={(id) => void setCollectionId(id)} />;
}

type NameDialogState = { readonly firstWork: GalleryWork | null } | null;

function Overview({
  gallery,
  onOpen,
}: {
  readonly gallery: Gallery;
  readonly onOpen: (collectionId: string) => void;
}) {
  const action = useGalleryAction();
  const [creating, setCreating] = useState<NameDialogState>(null);

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <Section
        title="Collections"
        titleId="gallery-collections"
        count={gallery.collections.length}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCreating({ firstWork: null });
            }}
          >
            <FolderPlus aria-hidden="true" /> New collection
          </Button>
        }
      >
        {gallery.collections.length === 0 ? (
          <div className="flex flex-col items-start gap-3 p-3">
            <p className="text-sm">
              Collections group finished work: a showreel, a pitch, a set to come back to.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setCreating({ firstWork: null });
              }}
            >
              Make your first collection
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {gallery.collections.map((collection) => (
              <CollectionTile
                key={collection.id}
                collection={collection}
                works={worksIn(collection, gallery.works)}
                onOpen={() => {
                  onOpen(collection.id);
                }}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="All finished work"
        titleId="gallery-works"
        count={gallery.works.length}
        description="Open a piece to watch it. Use the list button to file it in a collection."
      >
        {gallery.works.length === 0 ? (
          <div className="flex flex-col items-start gap-3 p-3">
            <p className="text-sm">
              Nothing is finished yet. Work lands here once a shot or quick create result is ready.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link href="/">Start a storyboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/create">Quick create</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {gallery.works.map((work) => (
              <WorkTile
                key={work.id}
                work={work}
                action={
                  <FileInMenu
                    work={work}
                    collections={gallery.collections}
                    onToggle={(collectionId, included) => {
                      action.mutate(
                        included
                          ? { type: "addItem", collectionId, itemId: work.id }
                          : { type: "removeItem", collectionId, itemId: work.id },
                      );
                    }}
                    onNew={() => {
                      setCreating({ firstWork: work });
                    }}
                  />
                }
              />
            ))}
          </ul>
        )}
      </Section>

      <CollectionNameDialog
        open={creating !== null}
        onOpenChange={(open) => {
          if (!open) setCreating(null);
        }}
        mode="create"
        collections={gallery.collections}
        collection={null}
        firstWorkTitle={creating?.firstWork?.title ?? null}
        onSubmit={({ name, visibility }) => {
          const firstWork = creating?.firstWork ?? null;
          action.mutate(
            { type: "create", name, visibility, itemId: firstWork?.id ?? null },
            {
              onSuccess: (result) => {
                const id = result.collectionId;
                toast(`"${name}" created.`, {
                  action:
                    id === null
                      ? undefined
                      : {
                          label: "Open",
                          onClick: () => {
                            onOpen(id);
                          },
                        },
                });
              },
            },
          );
        }}
      />
    </div>
  );
}

function CollectionTile({
  collection,
  works,
  onOpen,
}: {
  readonly collection: Collection;
  readonly works: readonly GalleryWork[];
  readonly onOpen: () => void;
}) {
  const covers = works.slice(0, 3);
  const pending = collection.id.startsWith("pending_");
  return (
    <li>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={onOpen}
        className="h-auto w-full flex-col items-stretch gap-1 rounded-sm p-1 text-start text-foreground hover:bg-card hover:text-foreground"
      >
        <span className="grid aspect-8/5 grid-cols-3 gap-0.5 overflow-hidden rounded-xs bg-card">
          {covers.length === 0 ? (
            <span className="col-span-3 flex items-center justify-center text-xs text-muted-foreground">
              Empty
            </span>
          ) : (
            covers.map((work, index) => (
              <span
                key={work.id}
                className={
                  covers.length === 1
                    ? "relative col-span-3"
                    : covers.length === 2 && index === 0
                      ? "relative col-span-2"
                      : "relative"
                }
              >
                <CoverArt art={work.cover.art} sfx={null} className="absolute inset-0" />
              </span>
            ))
          )}
        </span>
        <span className="flex items-center justify-between gap-2 px-2 pt-1 pb-2">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{collection.name}</span>
            <span className="tabular text-xs font-normal text-muted-foreground">
              {works.length === 0
                ? "No work yet"
                : `${String(works.length)} ${works.length === 1 ? "piece" : "pieces"}`}
            </span>
          </span>
          <VisibilityBadge visibility={collection.visibility} />
        </span>
      </Button>
    </li>
  );
}

/** Tick the collections a piece of work belongs in, or start a new one with it. */
function FileInMenu({
  work,
  collections,
  onToggle,
  onNew,
}: {
  readonly work: GalleryWork;
  readonly collections: readonly Collection[];
  readonly onToggle: (collectionId: string, included: boolean) => void;
  readonly onNew: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Add "${work.title}" to a collection`}>
          <ListPlus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Collections</DropdownMenuLabel>
        {collections.map((collection) => (
          <DropdownMenuCheckboxItem
            key={collection.id}
            checked={collection.itemIds.includes(work.id)}
            disabled={collection.id.startsWith("pending_")}
            onSelect={(event) => {
              // Keep the menu open so several collections can be ticked in a row.
              event.preventDefault();
            }}
            onCheckedChange={(checked) => {
              onToggle(collection.id, checked);
            }}
          >
            <span className="truncate">{collection.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
        {collections.length === 0 ? null : <DropdownMenuSeparator />}
        <DropdownMenuItem onSelect={onNew}>
          <Plus aria-hidden="true" /> New collection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
