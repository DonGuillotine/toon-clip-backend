"use client";

import { FileAudio, Plus, X } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FilePickButton } from "@/features/create/components/file-pick-button";

import { useCreateVoice } from "../mutations";
import { type CreateVoiceRequest, CreateVoiceRequestSchema } from "../schema";

type Source = CreateVoiceRequest["source"];

function isSource(value: string): value is Source {
  return value === "described" || value === "uploaded";
}

/** Largest sample the fixture accepts, in bytes. */
const MAX_SAMPLE_BYTES = 20 * 1024 * 1024;

/**
 * Make a voice from a description or from an uploaded sample. An upload
 * needs the user to confirm they have the right to use it (spec 12). The
 * file name is all the fixture keeps; real upload is the backend's.
 */
export function CreateVoiceDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Plus aria-hidden="true" /> New voice
        </Button>
      </DialogTrigger>
      {open ? (
        <CreateVoiceBody
          onCreated={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function CreateVoiceBody({ onCreated }: { readonly onCreated: () => void }) {
  const nameId = useId();
  const descriptionId = useId();
  const rightsId = useId();
  const [source, setSource] = useState<Source>("described");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sample, setSample] = useState<string | null>(null);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [rights, setRights] = useState(false);
  const create = useCreateVoice();

  const body: unknown =
    source === "described"
      ? { source, name, description }
      : { source, name, description, sampleFileName: sample, rightsConfirmed: rights };
  const parsed = CreateVoiceRequestSchema.safeParse(body);

  const hint =
    name.trim() === ""
      ? "Give the voice a name."
      : source === "described"
        ? description.trim().length < 8
          ? "Describe the voice in a few words: age, pace, accent, texture."
          : null
        : sample === null
          ? "Add a clean sample of the voice speaking."
          : rights
            ? null
            : "Confirm you have the right to use this voice.";

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New voice</DialogTitle>
        <DialogDescription>
          Describe a voice, or clone one from a sample you have the right to use.
        </DialogDescription>
      </DialogHeader>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!parsed.success) return;
          create.mutate(parsed.data, { onSuccess: onCreated });
        }}
      >
        <ToggleGroup
          type="single"
          size="sm"
          spacing={1}
          aria-label="Make it from"
          value={source}
          onValueChange={(next) => {
            if (isSource(next)) setSource(next);
          }}
        >
          <ToggleGroupItem value="described">A description</ToggleGroupItem>
          <ToggleGroupItem value="uploaded">An uploaded sample</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex flex-col gap-2">
          <Label htmlFor={nameId}>Name</Label>
          <Input
            id={nameId}
            value={name}
            maxLength={40}
            placeholder="For example: Mama Nkechi"
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={descriptionId}>
            {source === "described" ? "What does it sound like?" : "Notes (optional)"}
          </Label>
          <Textarea
            id={descriptionId}
            value={description}
            maxLength={300}
            placeholder="Older woman, warm and slow, Igbo accent, laughs easily"
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </div>

        {source === "uploaded" ? (
          <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
            {sample === null ? (
              <FilePickButton
                accept="audio/*"
                multiple={false}
                disabled={false}
                onFiles={(files) => {
                  const file = files[0];
                  if (!file) return;
                  if (file.size > MAX_SAMPLE_BYTES) {
                    setSampleError("That file is over 20 MB. Trim it to under a minute.");
                    return;
                  }
                  setSampleError(null);
                  setSample(file.name);
                }}
              >
                <FileAudio aria-hidden="true" /> Add a sample
              </FilePickButton>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <FileAudio aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{sample}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${sample}`}
                  onClick={() => {
                    setSample(null);
                  }}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            )}
            {sampleError === null ? (
              <p className="text-xs text-muted-foreground">
                30 seconds to a minute of clear speech works best.
              </p>
            ) : (
              <p className="text-xs text-destructive-foreground">{sampleError}</p>
            )}
            <div className="flex items-start gap-2">
              <Checkbox
                id={rightsId}
                checked={rights}
                onCheckedChange={(value) => {
                  setRights(value === true);
                }}
              />
              <Label htmlFor={rightsId} className="leading-snug">
                I have the right to use this voice, and the speaker agreed to it being cloned.
              </Label>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {hint === null ? null : (
            <p className="me-auto self-center text-xs text-muted-foreground">{hint}</p>
          )}
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={!parsed.success || create.isPending}>
            {create.isPending ? "Creating…" : "Create voice"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
