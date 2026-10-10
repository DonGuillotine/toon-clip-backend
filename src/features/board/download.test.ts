import { describe, expect, it } from "vitest";

import { boardDownload, crc32, tileFiles, tileSvg, zipStore } from "./download";
import { type MediaNode } from "./schema";

const tile: MediaNode = {
  id: "n1",
  kind: "image",
  pageId: "p1",
  groupId: null,
  x: 0,
  y: 0,
  label: "Kaito <leaps>",
  usedInTimeline: false,
  art: "burst",
  state: "ready",
};

describe("board downloads", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("draws a tile as escaped, labelled SVG", () => {
    const svg = tileSvg(tile);
    expect(svg).toContain("<svg");
    expect(svg).toContain("Kaito &lt;leaps&gt;");
    expect(svg).toContain("sample art");
  });

  it("names duplicate tiles uniquely", () => {
    const names = tileFiles([tile, { ...tile, id: "n2" }]).map((file) => file.name);
    expect(names).toEqual(["kaito-leaps.svg", "kaito-leaps-2.svg"]);
  });

  it("writes a zip with local headers and an end record", () => {
    const zip = zipStore(tileFiles([tile, { ...tile, id: "n2" }]));
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(zip.length - 12, true)).toBe(2);
  });

  it("serves one SVG alone, several as a zip, and nothing for no media", () => {
    expect(boardDownload("Board", [tile])?.contentType).toBe("image/svg+xml");
    expect(boardDownload("Courtyard fight", [tile, { ...tile, id: "n2" }])?.fileName).toBe(
      "courtyard-fight-2-tiles.zip",
    );
    expect(
      boardDownload("Board", [
        {
          id: "t",
          kind: "text",
          pageId: "p1",
          groupId: null,
          x: 0,
          y: 0,
          label: "Note",
          usedInTimeline: false,
          text: "hi",
        },
      ]),
    ).toBeNull();
  });
});
