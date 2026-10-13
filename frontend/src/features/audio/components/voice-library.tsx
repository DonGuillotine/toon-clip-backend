"use client";

import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Portrait } from "@/features/characters/components/portrait";
import { type CharacterSummary } from "@/features/characters/schema";

import { useDeleteVoice, useUpdateVoice } from "../mutations";
import { type Voice, type VoiceSource } from "../schema";
import { CreateVoiceDialog } from "./create-voice-dialog";
import { PreviewPlayer } from "./preview-player";
import { RenameDialog } from "./rename-dialog";

/** Every voice preview is a short line, the same length for all. */
const PREVIEW_SEC = 4;
/** Radix Select needs a non-empty value for "no character". */
const NO_CHARACTER = "none";

const SOURCE_LABEL = {
  sample: "Sample",
  described: "From a description",
  uploaded: "Cloned from a sample",
} satisfies Record<VoiceSource, string>;

/**
 * The voice library: sample voices and your own, each with a preview, and a
 * link to the character sheet it speaks for. One character has one voice.
 */
export function VoiceLibrary({
  voices,
  characters,
}: {
  readonly voices: readonly Voice[];
  /** `null` while the cast loads or when it failed; linking waits for it. */
  readonly characters: readonly CharacterSummary[] | null;
}) {
  return (
    <Section
      title="Voices"
      titleId="voice-library"
      count={voices.length}
      description="Link a voice to a character sheet so their lines always sound like them."
      action={<CreateVoiceDialog />}
    >
      {voices.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
          No voices yet. Describe one or clone one from a sample.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {voices.map((voice) => (
            <VoiceRow key={voice.id} voice={voice} characters={characters} />
          ))}
        </ul>
      )}
    </Section>
  );
}

function VoiceRow({
  voice,
  characters,
}: {
  readonly voice: Voice;
  readonly characters: readonly CharacterSummary[] | null;
}) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const update = useUpdateVoice();
  const remove = useDeleteVoice();
  const character = characters?.find((item) => item.id === voice.characterId) ?? null;

  return (
    <li className="flex flex-col gap-3 rounded-sm px-3 py-3 hover:bg-card">
      <div className="flex items-start gap-3">
        {character === null ? null : <Portrait character={character} size="sm" />}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {voice.name}
            <Badge>{SOURCE_LABEL[voice.source]}</Badge>
          </span>
          <span className="text-xs text-muted-foreground">{voice.description}</span>
          {voice.sampleFileName === null ? null : (
            <span className="truncate text-xs text-muted-foreground">
              Sample: {voice.sampleFileName}
            </span>
          )}
        </div>
        {voice.isSample ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`More for ${voice.name}`}>
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setRenaming(true);
                }}
              >
                <Pencil aria-hidden="true" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setDeleting(true);
                }}
              >
                <Trash2 aria-hidden="true" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PreviewPlayer
          id={`preview_${voice.id}`}
          label={voice.name}
          durationSec={PREVIEW_SEC}
          compact
        />
        <Select
          value={voice.characterId ?? NO_CHARACTER}
          disabled={characters === null}
          onValueChange={(next) => {
            update.mutate({
              id: voice.id,
              changes: { characterId: next === NO_CHARACTER ? null : next },
            });
          }}
        >
          <SelectTrigger size="sm" aria-label={`Character sheet for ${voice.name}`}>
            <SelectValue placeholder="Character" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CHARACTER}>No character</SelectItem>
            {(characters ?? []).map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RenameDialog
        open={renaming}
        noun="voice"
        current={voice.name}
        maxLength={40}
        onOpenChange={setRenaming}
        onSave={(name) => {
          update.mutate({ id: voice.id, changes: { name } });
          setRenaming(false);
        }}
      />

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {voice.name}?</DialogTitle>
            <DialogDescription>
              Lines it already read are kept.
              {character === null
                ? ""
                : ` ${character.name} will have no voice until you link one.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Keep it</Button>
            </DialogClose>
            <Button
              onClick={() => {
                remove.mutate(voice);
                setDeleting(false);
              }}
            >
              Delete voice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
