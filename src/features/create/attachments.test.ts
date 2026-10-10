import { describe, expect, it } from "vitest";

import { addAttachments, type Attachment, formatSize, TRAY_LIMIT } from "./attachments";

function file(name: string, size = 10, lastModified = 1): File {
  return new File(["x".repeat(size)], name, { lastModified });
}

function attachment(id: string, source: File): Attachment {
  return { id, kind: "image", name: source.name, size: source.size, file: source, attachedAt: 0 };
}

describe("addAttachments", () => {
  it("puts new files first", () => {
    const a = attachment("a", file("a.png"));
    const b = attachment("b", file("b.png"));
    expect(addAttachments([a], [b]).map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("keeps one copy of the same file, the newest", () => {
    const first = attachment("old", file("kaito.png", 10, 5));
    const again = attachment("new", file("kaito.png", 10, 5));
    expect(addAttachments([first], [again]).map((item) => item.id)).toEqual(["new"]);
  });

  it("treats a different size or time as a different file", () => {
    const one = attachment("1", file("kaito.png", 10, 5));
    const two = attachment("2", file("kaito.png", 11, 5));
    expect(addAttachments([one], [two])).toHaveLength(2);
  });

  it("drops repeats inside one batch", () => {
    const source = file("a.png");
    const result = addAttachments([], [attachment("x", source), attachment("y", source)]);
    expect(result.map((item) => item.id)).toEqual(["x"]);
  });

  it("caps the tray", () => {
    const many = Array.from({ length: TRAY_LIMIT + 5 }, (_, index) =>
      attachment(String(index), file(`${String(index)}.png`)),
    );
    expect(addAttachments([], many)).toHaveLength(TRAY_LIMIT);
  });
});

describe("formatSize", () => {
  it("names bytes, kilobytes and megabytes", () => {
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(2048)).toBe("2 KB");
    expect(formatSize(3_500_000)).toBe("3.3 MB");
  });
});
