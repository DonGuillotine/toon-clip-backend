import {
  type ExportShot,
  type PsdOptions,
  type Resolution,
  type VideoOptions,
  type VideoPreset,
} from "./schema";

/** Spec 7.7 defaults. Frame rate is 12 (24 is for photoreal styles). */
export const DEFAULT_PSD_OPTIONS: PsdOptions = {
  organizeBy: "panel",
  separateBackground: true,
  transparentCharacter: true,
  backgroundPlate: "per-panel",
  frameRate: 12,
  paletteLayer: false,
  shotIds: null,
};

export const DEFAULT_VIDEO_OPTIONS: VideoOptions = {
  preset: "16:9",
  customSize: { width: 1080, height: 1350 },
  format: "mp4",
  resolution: 1080,
  audio: "mixed",
  subtitles: "off",
  destination: "download",
  upload: { title: "", description: "", visibility: "unlisted" },
};

/** The default resolution, capped at what the takes were generated at. */
export function defaultVideoOptions(maxResolution: Resolution, title = ""): VideoOptions {
  const resolution =
    maxResolution < DEFAULT_VIDEO_OPTIONS.resolution
      ? maxResolution
      : DEFAULT_VIDEO_OPTIONS.resolution;
  return {
    ...DEFAULT_VIDEO_OPTIONS,
    resolution,
    upload: { ...DEFAULT_VIDEO_OPTIONS.upload, title },
  };
}

/**
 * Why a video export cannot start yet, in words the panel shows, or `null`
 * when it can. Uploading needs a connected account and a title.
 */
export function videoProblem(options: VideoOptions, accountConnected: boolean): string | null {
  if (options.preset === "custom") {
    const { width, height } = options.customSize;
    const inRange = (value: number) => Number.isInteger(value) && value >= 256 && value <= 4096;
    if (!inRange(width) || !inRange(height)) {
      return "Custom sizes run from 256 to 4096 px on each side.";
    }
  }
  if (options.destination === "upload") {
    if (!accountConnected) return "Connect an account to upload, or choose Download.";
    if (options.upload.title.trim() === "") return "Give the upload a title.";
  }
  return null;
}

/** Output pixel size for a preset at a resolution (the short edge). */
export function outputSize(
  preset: VideoPreset,
  resolution: Resolution,
  custom: VideoOptions["customSize"],
): { readonly width: number; readonly height: number } {
  switch (preset) {
    case "16:9":
      return { width: Math.round((resolution * 16) / 9), height: resolution };
    case "9:16":
      return { width: resolution, height: Math.round((resolution * 16) / 9) };
    case "1:1":
      return { width: resolution, height: resolution };
    case "custom":
      return custom;
  }
}

/** `S{sheet}_SH{shot}_F{0001}`, the spec's layer name. */
export function frameLayerName(sheet: number, shot: number, frame: number): string {
  return `S${String(sheet)}_SH${String(shot)}_F${String(frame).padStart(4, "0")}`;
}

export type LayerFolder = {
  readonly name: string;
  /** The first few layers, in playback order, then any background layers. */
  readonly layers: readonly string[];
  /** Frame layers not listed, so the preview stays short. */
  readonly moreFrames: number;
};

export type LayerFile = {
  readonly fileName: string;
  readonly folders: readonly LayerFolder[];
};

const PREVIEW_FRAMES = 3;

/**
 * Layers one PSD may hold before it is split into numbered files. A
 * stand-in until the PSD writer library is evaluated (spec 7.7).
 */
export const MAX_LAYERS_PER_FILE = 250;

/** Every layer in a file, including the frames the preview leaves out. */
export function layerCount(file: LayerFile): number {
  return file.folders.reduce(
    (total, folder) => total + folder.layers.length + folder.moreFrames,
    0,
  );
}

/** How many numbered files a PSD becomes once it passes the layer limit. */
export function partsFor(file: LayerFile): number {
  return Math.max(1, Math.ceil(layerCount(file) / MAX_LAYERS_PER_FILE));
}

function folderFor(shot: ExportShot, options: PsdOptions): LayerFolder {
  const prefix = `S${String(shot.sheet)}_SH${String(shot.shot)}`;
  const frames = Math.max(1, Math.round(shot.durationSec * options.frameRate));
  const shown = Math.min(frames, PREVIEW_FRAMES);
  const layers: string[] = [];
  for (let frame = 1; frame <= shown; frame += 1) {
    layers.push(frameLayerName(shot.sheet, shot.shot, frame));
  }
  if (options.separateBackground) {
    layers.push(
      options.backgroundPlate === "per-panel"
        ? `${prefix}_BG (locked)`
        : `${prefix}_F0001_BG to ${frameLayerName(shot.sheet, shot.shot, frames)}_BG (locked)`,
    );
  }
  return { name: prefix, layers, moreFrames: frames - shown };
}

/**
 * The file and layer structure an export will produce, for the preview.
 * Panels map one to one onto shots until the API defines panels.
 */
export function layerStructure(
  shots: readonly ExportShot[],
  options: PsdOptions,
): readonly LayerFile[] {
  const selected = options.shotIds;
  const included = selected === null ? shots : shots.filter((shot) => selected.includes(shot.id));
  const palette: readonly LayerFolder[] = options.paletteLayer
    ? [{ name: "Palette reference", layers: ["Palette"], moreFrames: 0 }]
    : [];

  if (options.organizeBy === "sequence") {
    return [
      {
        fileName: "sequence.psd",
        folders: [...included.map((shot) => folderFor(shot, options)), ...palette],
      },
    ];
  }
  return included.map((shot) => {
    const folder = folderFor(shot, options);
    return { fileName: `${folder.name}.psd`, folders: [folder, ...palette] };
  });
}
