import { artSvg } from "@/lib/art-svg";

import { isMedia } from "./actions";
import { type BoardNode, type MediaNode } from "./schema";

/**
 * Building the files behind the board's Download action. Pure, so the route
 * handler serves it and the tests check it byte for byte. Until takes have
 * real media, a tile downloads as a labelled SVG of its placeholder art.
 */

/** One tile as a standalone SVG document, labelled as sample art. */
export function tileSvg(node: MediaNode): string {
  const kind = node.kind === "video" ? `Video, ${String(node.durationSec)} s` : "Image";
  return artSvg(node.art, `${node.label} (${kind}, sample art)`);
}

const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tile";

export type DownloadFile = { readonly name: string; readonly data: Uint8Array<ArrayBuffer> };

/** Unique file names for the selected tiles, in board order. */
export function tileFiles(nodes: readonly BoardNode[]): DownloadFile[] {
  const used = new Map<string, number>();
  const encoder = new TextEncoder();
  return nodes.filter(isMedia).map((node) => {
    const base = slug(node.label);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    const name = seen === 0 ? `${base}.svg` : `${base}-${String(seen + 1)}.svg`;
    return { name, data: encoder.encode(tileSvg(node)) };
  });
}

// CRC-32 (IEEE), as zip requires.
const CRC_TABLE: readonly number[] = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * A zip archive with every file stored uncompressed. Small, dependency free,
 * and opens in every unzip tool. Fine for a handful of SVG tiles.
 */
export function zipStore(files: readonly DownloadFile[]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, 0, true); // stored
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    chunks.push(local, file.data);

    const entry = new Uint8Array(46 + name.length);
    const cv = new DataView(entry.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    entry.set(name, 46);
    central.push(entry);

    offset += local.length + size;
  }

  const centralSize = central.reduce((total, entry) => total + entry.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const parts = [...chunks, ...central, end];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

export type BoardDownload = {
  readonly fileName: string;
  readonly contentType: string;
  readonly data: Uint8Array<ArrayBuffer>;
};

/**
 * One tile downloads as its SVG; several download as one zip named after the
 * board. `null` when nothing downloadable is selected.
 */
export function boardDownload(
  boardTitle: string,
  nodes: readonly BoardNode[],
): BoardDownload | null {
  const files = tileFiles(nodes);
  const [only] = files;
  if (!only) return null;
  if (files.length === 1) {
    return { fileName: only.name, contentType: "image/svg+xml", data: only.data };
  }
  return {
    fileName: `${slug(boardTitle)}-${String(files.length)}-tiles.zip`,
    contentType: "application/zip",
    data: zipStore(files),
  };
}

/** The URL the toolbar opens to download a selection. */
export function boardDownloadPath(storyboardId: string, nodeIds: readonly string[]): string {
  const query = new URLSearchParams({ ids: nodeIds.join(",") });
  return `/api/boards/${encodeURIComponent(storyboardId)}/download?${query.toString()}`;
}
