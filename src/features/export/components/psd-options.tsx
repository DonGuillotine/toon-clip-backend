"use client";

import { Info } from "lucide-react";
import { useId } from "react";

import { Section } from "@/components/section";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { layerStructure } from "../options";
import {
  type BackgroundPlate,
  type ExportShot,
  type FrameRate,
  FRAME_RATES,
  type PsdOptions,
  type PsdOrganize,
} from "../schema";
import { type Choice, ChoiceField, SwitchField } from "./fields";

const ORGANIZE: readonly Choice<PsdOrganize>[] = [
  { value: "panel", label: "Panel" },
  { value: "shot", label: "Shot" },
  { value: "sequence", label: "Whole sequence" },
];
const PLATES: readonly Choice<BackgroundPlate>[] = [
  { value: "per-panel", label: "One per panel" },
  { value: "per-frame", label: "One per frame" },
];
const RATES: readonly Choice<FrameRate>[] = FRAME_RATES.map((rate) => ({
  value: rate,
  label: `${String(rate)} fps`,
}));
const RANGE: readonly Choice<"all" | "selected">[] = [
  { value: "all", label: "All shots" },
  { value: "selected", label: "Selected shots" },
];

const shotName = (shot: ExportShot): string =>
  `Sheet ${String(shot.sheet)}, shot ${String(shot.shot)}`;

/** Layered PSD options (spec 7.7), with a live preview of the file structure. */
export function PsdOptionsForm({
  options,
  shots,
  onChange,
}: {
  readonly options: PsdOptions;
  readonly shots: readonly ExportShot[];
  readonly onChange: (options: PsdOptions) => void;
}) {
  const set = (patch: Partial<PsdOptions>) => {
    onChange({ ...options, ...patch });
  };
  const rangeId = useId();
  const selected = options.shotIds;

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Layered PSD"
        titleId="psd-options"
        description="Keep painting in your own tools."
      >
        <div className="flex flex-col">
          <ChoiceField
            label="Organize by"
            value={options.organizeBy}
            choices={ORGANIZE}
            onChange={(organizeBy) => {
              set({ organizeBy });
            }}
          />
          <SwitchField
            label="Background separate from character"
            checked={options.separateBackground}
            onChange={(separateBackground) => {
              set({ separateBackground });
            }}
          />
          <SwitchField
            label="Character on a transparent layer"
            checked={options.transparentCharacter}
            onChange={(transparentCharacter) => {
              set({ transparentCharacter });
            }}
          />
          <ChoiceField
            label="Background plate"
            value={options.backgroundPlate}
            choices={PLATES.map((plate) => ({ ...plate, disabled: !options.separateBackground }))}
            onChange={(backgroundPlate) => {
              set({ backgroundPlate });
            }}
          />
          <ChoiceField
            label="Frame rate"
            hint="12 fps suits drawn styles. Use 24 for photoreal ones."
            value={options.frameRate}
            choices={RATES}
            onChange={(frameRate) => {
              set({ frameRate });
            }}
          />
          <SwitchField
            label="Palette reference layer"
            checked={options.paletteLayer}
            onChange={(paletteLayer) => {
              set({ paletteLayer });
            }}
          />
          <ChoiceField
            label="Range"
            value={selected === null ? "all" : "selected"}
            choices={RANGE}
            onChange={(range) => {
              set({ shotIds: range === "all" ? null : shots.map((shot) => shot.id) });
            }}
          />
          {selected === null ? null : (
            <ul aria-label="Shots to include" className="flex flex-col gap-1 px-3 pb-3">
              {shots.map((shot) => {
                const checked = selected.includes(shot.id);
                const id = `${rangeId}-${shot.id}`;
                return (
                  <li key={shot.id} className="flex min-h-11 items-center gap-3 px-3">
                    <Checkbox
                      id={id}
                      checked={checked}
                      // The last shot cannot be cleared: an export needs one.
                      disabled={checked && selected.length === 1}
                      onCheckedChange={(next) => {
                        set({
                          shotIds:
                            next === true
                              ? shots
                                  .filter(
                                    (item) => item.id === shot.id || selected.includes(item.id),
                                  )
                                  .map((item) => item.id)
                              : selected.filter((item) => item !== shot.id),
                        });
                      }}
                    />
                    <Label htmlFor={id} className="font-normal">
                      {shotName(shot)}
                    </Label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Section>

      <LayerPreview options={options} shots={shots} />
    </div>
  );
}

function LayerPreview({
  options,
  shots,
}: {
  readonly options: PsdOptions;
  readonly shots: readonly ExportShot[];
}) {
  const files = layerStructure(shots, options);

  return (
    <Section
      title="What you get"
      titleId="psd-structure"
      description="One file per panel, bundled in a zip. RGB, 8-bit, sRGB, full-canvas layers."
      footer={
        <span className="flex flex-col gap-2">
          <span className="flex items-start gap-2">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            Edges around hair, motion blur and effects may need cleanup after the background is
            separated.
          </span>
          <span className="flex items-start gap-2">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            Audio cannot live in a PSD, so it comes as a separate file in the zip.
          </span>
        </span>
      }
    >
      <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
        {files.map((file) => (
          <li key={file.fileName} className="flex flex-col gap-1 rounded-sm px-3 py-2">
            <span className="tabular text-sm font-medium">{file.fileName}</span>
            <ul className="flex flex-col gap-1 ps-4">
              {file.folders.map((folder) => (
                <li key={folder.name} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Folder {folder.name}</span>
                  <ul className="flex flex-col ps-4 font-mono text-xs">
                    {folder.layers.map((layer) => (
                      <li key={layer}>{layer}</li>
                    ))}
                    {folder.moreFrames > 0 ? (
                      <li className="text-muted-foreground">
                        and {folder.moreFrames} more frame layers
                      </li>
                    ) : null}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
