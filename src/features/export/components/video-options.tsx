"use client";

import { Stamp, Upload } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";

import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { outputSize } from "../options";
import {
  type AudioMode,
  type Destination,
  type ExportsResponse,
  type Resolution,
  RESOLUTIONS,
  type SubtitleMode,
  type VideoFormat,
  type VideoOptions,
  type VideoPreset,
} from "../schema";
import { type Choice, ChoiceField } from "./fields";

const PRESETS: readonly Choice<VideoPreset>[] = [
  { value: "16:9", label: "Landscape 16:9" },
  { value: "9:16", label: "Vertical 9:16" },
  { value: "1:1", label: "Square 1:1" },
  { value: "custom", label: "Custom" },
];
const FORMATS: readonly Choice<VideoFormat>[] = [
  { value: "mp4", label: "MP4 (H.264)" },
  { value: "webm", label: "WebM" },
];
const AUDIO: readonly Choice<AudioMode>[] = [
  { value: "mixed", label: "Mixed audio" },
  { value: "silent", label: "Silent" },
];
const SUBTITLES: readonly Choice<SubtitleMode>[] = [
  { value: "off", label: "None" },
  { value: "burned", label: "Burned in" },
  { value: "separate", label: "Separate file" },
];
/** Platforms are an open decision, so the spec's placeholder stands in. */
const PLATFORM = "[PLATFORM]";

function parseSize(raw: string): number {
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? 0 : value;
}

/** Video options (spec 7.7). */
export function VideoOptionsForm({
  options,
  data,
  onChange,
}: {
  readonly options: VideoOptions;
  readonly data: ExportsResponse;
  readonly onChange: (options: VideoOptions) => void;
}) {
  const set = (patch: Partial<VideoOptions>) => {
    onChange({ ...options, ...patch });
  };
  const widthId = useId();
  const heightId = useId();
  const max = data.storyboard.maxResolution;
  const size = outputSize(options.preset, options.resolution, options.customSize);
  const connected = data.uploadAccount;
  const destinations: readonly Choice<Destination>[] = [
    { value: "download", label: "Download" },
    { value: "upload", label: `Upload to ${PLATFORM}`, disabled: connected === null },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Section title="Video" titleId="video-options" description="A finished clip, ready to post.">
        <div className="flex flex-col">
          <ChoiceField
            label="Size"
            hint={`Renders at ${String(size.width)} x ${String(size.height)}.`}
            value={options.preset}
            choices={PRESETS}
            onChange={(preset) => {
              set({ preset });
            }}
          />
          {options.preset === "custom" ? (
            <div className="flex gap-3 px-3 pb-3">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor={widthId}>Width (px)</Label>
                <Input
                  id={widthId}
                  inputMode="numeric"
                  value={String(options.customSize.width)}
                  onChange={(event) => {
                    set({
                      customSize: { ...options.customSize, width: parseSize(event.target.value) },
                    });
                  }}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor={heightId}>Height (px)</Label>
                <Input
                  id={heightId}
                  inputMode="numeric"
                  value={String(options.customSize.height)}
                  onChange={(event) => {
                    set({
                      customSize: { ...options.customSize, height: parseSize(event.target.value) },
                    });
                  }}
                />
              </div>
            </div>
          ) : null}
          <ChoiceField
            label="Format"
            value={options.format}
            choices={FORMATS}
            onChange={(format) => {
              set({ format });
            }}
          />
          <ChoiceField
            label="Resolution"
            hint={`Your takes were made at ${String(max)}p. Upscaling is a separate action.`}
            value={options.resolution}
            choices={RESOLUTIONS.map((value): Choice<Resolution> => ({
              value,
              label: `${String(value)}p`,
              disabled: value > max,
            }))}
            onChange={(resolution) => {
              set({ resolution });
            }}
          />
          <ChoiceField
            label="Audio"
            value={options.audio}
            choices={AUDIO}
            onChange={(audio) => {
              set({ audio });
            }}
          />
          <ChoiceField
            label="Subtitles"
            value={options.subtitles}
            choices={SUBTITLES}
            onChange={(subtitles) => {
              set({ subtitles });
            }}
          />
        </div>
      </Section>

      <Section title="Where it goes" titleId="video-destination">
        <div className="flex flex-col">
          <ChoiceField
            label="Destination"
            value={options.destination}
            choices={destinations}
            onChange={(destination) => {
              set({ destination });
            }}
          />
          {connected === null ? (
            <div className="flex flex-col items-start gap-3 px-3 pb-3">
              <p className="text-sm text-muted-foreground">
                No {PLATFORM} account is connected, so this export downloads. Connect one to set a
                title, description and visibility and upload after it renders.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toast(`Connecting a ${PLATFORM} account is not built yet.`);
                }}
              >
                <Upload aria-hidden="true" /> Connect {PLATFORM}
              </Button>
            </div>
          ) : (
            <p className="px-3 pb-3 text-sm text-muted-foreground">
              Uploads to {connected.platform} as @{connected.handle} after it renders.
            </p>
          )}
        </div>
      </Section>

      {data.watermark === null ? null : (
        <p className="flex items-start gap-2 px-3 text-sm text-muted-foreground">
          <Stamp aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Watermark.</span> {data.watermark}
          </span>
        </p>
      )}
    </div>
  );
}
