import { describe, expect, it } from "vitest";

import {
  DEFAULT_PSD_OPTIONS,
  defaultVideoOptions,
  frameLayerName,
  layerCount,
  layerStructure,
  MAX_LAYERS_PER_FILE,
  outputSize,
  partsFor,
  videoProblem,
} from "./options";
import { type ExportShot, type VideoOptions } from "./schema";

const shots: readonly ExportShot[] = [
  { id: "a", sheet: 1, shot: 1, durationSec: 2 },
  { id: "b", sheet: 1, shot: 2, durationSec: 1 },
];

describe("frameLayerName", () => {
  it("follows S{sheet}_SH{shot}_F{0001}", () => {
    expect(frameLayerName(2, 3, 7)).toBe("S2_SH3_F0007");
  });
});

describe("layerStructure", () => {
  it("makes one file per panel with a locked background by default", () => {
    const files = layerStructure(shots, DEFAULT_PSD_OPTIONS);
    expect(files.map((file) => file.fileName)).toEqual(["S1_SH1.psd", "S1_SH2.psd"]);
    const folder = files[0]?.folders[0];
    expect(folder?.layers).toEqual([
      "S1_SH1_F0001",
      "S1_SH1_F0002",
      "S1_SH1_F0003",
      "S1_SH1_BG (locked)",
    ]);
    expect(folder?.moreFrames).toBe(21);
  });

  it("puts everything in one file for a whole sequence, with a palette layer", () => {
    const files = layerStructure(shots, {
      ...DEFAULT_PSD_OPTIONS,
      organizeBy: "sequence",
      paletteLayer: true,
      separateBackground: false,
    });
    expect(files).toHaveLength(1);
    expect(files[0]?.folders.map((folder) => folder.name)).toEqual([
      "S1_SH1",
      "S1_SH2",
      "Palette reference",
    ]);
    expect(files[0]?.folders[0]?.layers.some((layer) => layer.includes("BG"))).toBe(false);
  });

  it("only includes selected shots", () => {
    const files = layerStructure(shots, { ...DEFAULT_PSD_OPTIONS, shotIds: ["b"] });
    expect(files.map((file) => file.fileName)).toEqual(["S1_SH2.psd"]);
  });
});

describe("video sizing", () => {
  it("caps the default resolution at the generated one", () => {
    expect(defaultVideoOptions(720).resolution).toBe(720);
    expect(defaultVideoOptions(1080).resolution).toBe(1080);
  });

  it("derives the output size from the preset", () => {
    const custom = { width: 800, height: 600 };
    expect(outputSize("16:9", 1080, custom)).toEqual({ width: 1920, height: 1080 });
    expect(outputSize("9:16", 720, custom)).toEqual({ width: 720, height: 1280 });
    expect(outputSize("1:1", 480, custom)).toEqual({ width: 480, height: 480 });
    expect(outputSize("custom", 480, custom)).toEqual(custom);
  });
});

describe("splitting large PSDs", () => {
  it("keeps a short shot in one file", () => {
    const [file] = layerStructure(shots, DEFAULT_PSD_OPTIONS);
    expect(file === undefined ? 0 : partsFor(file)).toBe(1);
  });

  it("splits a file that passes the layer limit into numbered parts", () => {
    const long: readonly ExportShot[] = [{ id: "c", sheet: 1, shot: 1, durationSec: 15 }];
    const [file] = layerStructure(long, { ...DEFAULT_PSD_OPTIONS, frameRate: 30 });
    if (!file) throw new Error("expected a file");
    // 450 frames plus one background plate.
    expect(layerCount(file)).toBe(451);
    expect(partsFor(file)).toBe(Math.ceil(451 / MAX_LAYERS_PER_FILE));
  });
});

describe("videoProblem", () => {
  it("needs an account and a title to upload", () => {
    const base = defaultVideoOptions(1080, "");
    const upload: VideoOptions = { ...base, destination: "upload" };
    expect(videoProblem(base, false)).toBeNull();
    expect(videoProblem(upload, false)).toMatch(/Connect/);
    expect(videoProblem(upload, true)).toMatch(/title/);
    expect(
      videoProblem({ ...upload, upload: { ...upload.upload, title: "Clip" } }, true),
    ).toBeNull();
  });
});
