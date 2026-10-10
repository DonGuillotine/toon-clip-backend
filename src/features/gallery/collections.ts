import { type Collection, type GalleryAction } from "./schema";

/**
 * The rules for curating collections, as one pure reducer. The fixture API
 * applies it for real; the client applies the same function optimistically,
 * so what you see before the server answers is what the server will say.
 */

export type ActionContext = {
  /** ISO time stamped on anything the action changes. */
  readonly now: string;
  /** Id for a collection the action creates. */
  readonly newId: string;
  /** Every work id that exists, so a collection never points at nothing. */
  readonly workIds: ReadonlySet<string>;
};

export type ActionOutcome =
  | {
      readonly ok: true;
      readonly collections: readonly Collection[];
      readonly collectionId: string | null;
    }
  | { readonly ok: false; readonly status: 404 | 409 | 422; readonly message: string };

function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/** Whether another collection already uses this name, ignoring case. */
export function nameTaken(
  collections: readonly Collection[],
  name: string,
  exceptId: string | null = null,
): boolean {
  return collections.some(
    (collection) => collection.id !== exceptId && sameName(collection.name, name),
  );
}

function update(
  collections: readonly Collection[],
  id: string,
  change: (collection: Collection) => Collection,
): readonly Collection[] {
  return collections.map((collection) => (collection.id === id ? change(collection) : collection));
}

export function applyGalleryAction(
  collections: readonly Collection[],
  action: GalleryAction,
  context: ActionContext,
): ActionOutcome {
  if (action.type === "create") {
    const name = action.name.trim();
    if (nameTaken(collections, name)) {
      return { ok: false, status: 409, message: `You already have a collection called "${name}".` };
    }
    if (action.itemId !== null && !context.workIds.has(action.itemId)) {
      return { ok: false, status: 404, message: "That work is not in your gallery." };
    }
    const created: Collection = {
      id: context.newId,
      name,
      description: "",
      visibility: action.visibility,
      itemIds: action.itemId === null ? [] : [action.itemId],
      createdAt: context.now,
      updatedAt: context.now,
    };
    return { ok: true, collections: [created, ...collections], collectionId: created.id };
  }

  const target = collections.find((collection) => collection.id === action.collectionId);
  if (!target) return { ok: false, status: 404, message: "That collection is not here." };

  switch (action.type) {
    case "rename": {
      const name = action.name.trim();
      if (nameTaken(collections, name, target.id)) {
        return {
          ok: false,
          status: 409,
          message: `You already have a collection called "${name}".`,
        };
      }
      return {
        ok: true,
        collections: update(collections, target.id, (collection) => ({
          ...collection,
          name,
          updatedAt: context.now,
        })),
        collectionId: target.id,
      };
    }
    case "setVisibility":
      return {
        ok: true,
        collections: update(collections, target.id, (collection) => ({
          ...collection,
          visibility: action.visibility,
          updatedAt: context.now,
        })),
        collectionId: target.id,
      };
    case "delete":
      // Deleting a collection never deletes the work in it.
      return {
        ok: true,
        collections: collections.filter((collection) => collection.id !== target.id),
        collectionId: null,
      };
    case "addItem": {
      if (!context.workIds.has(action.itemId)) {
        return { ok: false, status: 404, message: "That work is not in your gallery." };
      }
      // Adding twice is harmless: the collection already has it.
      if (target.itemIds.includes(action.itemId)) {
        return { ok: true, collections, collectionId: target.id };
      }
      return {
        ok: true,
        collections: update(collections, target.id, (collection) => ({
          ...collection,
          itemIds: [...collection.itemIds, action.itemId],
          updatedAt: context.now,
        })),
        collectionId: target.id,
      };
    }
    case "removeItem":
      return {
        ok: true,
        collections: update(collections, target.id, (collection) => ({
          ...collection,
          itemIds: collection.itemIds.filter((id) => id !== action.itemId),
          updatedAt: context.now,
        })),
        collectionId: target.id,
      };
  }
}

/** The work in a collection, in its order, skipping ids that no longer resolve. */
export function worksIn<Work extends { readonly id: string }>(
  collection: Collection,
  works: readonly Work[],
): Work[] {
  const byId = new Map(works.map((work) => [work.id, work]));
  const found: Work[] = [];
  for (const id of collection.itemIds) {
    const work = byId.get(id);
    if (work) found.push(work);
  }
  return found;
}

/** The address a collection is shared at. */
export function shareUrl(origin: string, collectionId: string): string {
  const url = new URL("/gallery", origin);
  url.searchParams.set("collection", collectionId);
  return url.toString();
}
