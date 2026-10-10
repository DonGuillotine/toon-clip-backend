import { create } from "zustand";

import { addAttachments, type Attachment } from "./attachments";
import { type ReferenceKind } from "./schema";

/**
 * The attachments tray: cross-cutting client state with no server or URL
 * home (uploads are not sent yet). Quick create pushes every picked file in;
 * the tray asks Quick create to attach one again through `pending`.
 */
type AttachmentsState = {
  readonly items: readonly Attachment[];
  /** Attachments the tray asked Quick create to add back, in order. */
  readonly pending: readonly Attachment[];
  readonly add: (kind: ReferenceKind, files: readonly File[]) => void;
  readonly remove: (id: string) => void;
  readonly clear: () => void;
  readonly requestAttach: (id: string) => void;
  /** Hand the pending attachments to Quick create and empty the queue. */
  readonly takePending: () => readonly Attachment[];
};

export const useAttachmentsStore = create<AttachmentsState>()((set, get) => ({
  items: [],
  pending: [],
  add: (kind, files) => {
    const now = Date.now();
    const incoming = files.map((file): Attachment => ({
      id: crypto.randomUUID(),
      kind,
      name: file.name,
      size: file.size,
      file,
      attachedAt: now,
    }));
    set({ items: addAttachments(get().items, incoming) });
  },
  remove: (id) => {
    set({
      items: get().items.filter((item) => item.id !== id),
      pending: get().pending.filter((item) => item.id !== id),
    });
  },
  clear: () => {
    set({ items: [], pending: [] });
  },
  requestAttach: (id) => {
    const item = get().items.find((candidate) => candidate.id === id);
    if (item) set({ pending: [...get().pending, item] });
  },
  takePending: () => {
    const { pending } = get();
    if (pending.length > 0) set({ pending: [] });
    return pending;
  },
}));
