import { type ReferenceKind } from "./schema";

/**
 * Files attached in Quick create this session. The attachments tray in the
 * top bar lists them so a file can be re-attached without picking it again.
 * Uploads are not sent yet (CONTRACT: unconfirmed), so this is client only.
 */
export type Attachment = {
  readonly id: string;
  readonly kind: ReferenceKind;
  readonly name: string;
  readonly size: number;
  readonly file: File;
  readonly attachedAt: number;
};

/** The same file picked twice is one attachment: name, size and modified time match. */
export function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/** Most recent first, the newest copy of a repeated file wins, capped. */
export const TRAY_LIMIT = 30;

export function addAttachments(
  current: readonly Attachment[],
  incoming: readonly Attachment[],
): readonly Attachment[] {
  const fresh = incoming.filter(
    (item, index) => incoming.findIndex((other) => sameFile(other.file, item.file)) === index,
  );
  const kept = current.filter((item) => !fresh.some((other) => sameFile(other.file, item.file)));
  return [...fresh, ...kept].slice(0, TRAY_LIMIT);
}

/** 2048 becomes "2 KB", 3_500_000 becomes "3.3 MB". */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
