import { describe, expect, it } from "vitest";

import {
  countByKind,
  insertTag,
  nextTag,
  type Reference,
  remaining,
  swapFrames,
  tagsInPrompt,
  unknownTags,
} from "./references";

const ref = (kind: Reference["kind"], tag: string): Reference => ({
  id: tag,
  kind,
  tag,
  name: `${tag}.file`,
  url: "",
});

describe("references", () => {
  it("counts and limits by kind", () => {
    const refs = [ref("image", "@image1"), ref("image", "@image2"), ref("audio", "@audio1")];
    expect(countByKind(refs)).toEqual({ image: 2, video: 0, audio: 1 });
    expect(remaining(refs, "image")).toBe(7);
    expect(remaining(refs, "audio")).toBe(2);
  });

  it("reuses the lowest free tag", () => {
    expect(nextTag([ref("image", "@image1"), ref("image", "@image3")], "image")).toBe("@image2");
    expect(nextTag([], "video")).toBe("@video1");
  });

  it("finds tags and flags unknown ones", () => {
    const prompt = "Kaito walks like @video1 past @image1 and @image1 again, @image4";
    expect(tagsInPrompt(prompt)).toEqual(["@video1", "@image1", "@image4"]);
    expect(unknownTags(prompt, [ref("image", "@image1"), ref("video", "@video1")])).toEqual([
      "@image4",
    ]);
  });

  it("inserts a tag at the caret with spacing", () => {
    expect(insertTag("Kaito runs", "@image1", 5)).toEqual({
      text: "Kaito @image1 runs",
      caret: 13,
    });
    expect(insertTag("", "@audio1", 0)).toEqual({ text: "@audio1 ", caret: 8 });
  });

  it("swaps frames", () => {
    expect(swapFrames({ first: "a", last: null })).toEqual({ first: null, last: "a" });
  });
});
