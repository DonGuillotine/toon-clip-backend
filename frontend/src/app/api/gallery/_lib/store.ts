import { applyGalleryAction, type ActionOutcome } from "@/features/gallery/collections";
import { collectionsFixture } from "@/features/gallery/mocks";
import {
  type Collection,
  type Gallery,
  type GalleryAction,
  GallerySchema,
  type GalleryWork,
} from "@/features/gallery/schema";
import { getWatchLibrary } from "@/features/watch/server";

import { getBoard } from "../../storyboards/_lib/store";

/**
 * The in-memory stand-in for the gallery API. Only route handlers import
 * this file. State lives on `globalThis` so every route bundle shares it.
 */

type Store = { collections: readonly Collection[]; counter: number };

const scope: typeof globalThis & { toonClipGalleryStore?: Store } = globalThis;

function store(): Store {
  scope.toonClipGalleryStore ??= { collections: collectionsFixture, counter: 0 };
  return scope.toonClipGalleryStore;
}

/** Finished work, read from the same library the Watch page plays. */
function works(): GalleryWork[] {
  return getWatchLibrary((id) => getBoard(id)).map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    subtitle: item.subtitle,
    durationSec: item.durationSec,
    updatedAt: item.updatedAt,
    cover: item.cover,
  }));
}

export function getGallery(): Gallery {
  return GallerySchema.parse({ works: works(), collections: store().collections });
}

export function actOnGallery(action: GalleryAction): ActionOutcome {
  const current = store();
  current.counter += 1;
  const outcome = applyGalleryAction(current.collections, action, {
    now: new Date().toISOString(),
    newId: `col_${crypto.randomUUID().slice(0, 8)}`,
    workIds: new Set(works().map((work) => work.id)),
  });
  if (outcome.ok) current.collections = outcome.collections;
  return outcome;
}
