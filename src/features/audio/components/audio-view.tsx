"use client";

import { useQuery } from "@tanstack/react-query";
import { Mic, Music, Sparkles } from "lucide-react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { charactersQuery } from "@/features/characters/queries";
import { useHydrated } from "@/lib/use-hydrated";

import { audioLibraryQuery } from "../queries";
import { AUDIO_TABS, type AudioTab } from "../schema";
import { AudioLibrary } from "./audio-library";
import { MusicComposer } from "./music-composer";
import { ProgressAnnouncer } from "./progress-announcer";
import { SpeechComposer } from "./speech-composer";
import { VoiceLibrary } from "./voice-library";

function isAudioTab(value: string): value is AudioTab {
  return AUDIO_TABS.some((tab) => tab === value);
}

/**
 * Music and voices: generate music, voice lines with a chosen voice, keep a
 * voice library linked to character sheets, and preview everything in one
 * library. The tab lives in the URL.
 */
export function AudioView() {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(AUDIO_TABS).withDefault("music"));
  const library = useQuery(audioLibraryQuery);
  // The cast is also read by the dock, so it waits for hydration (AGENTS.md §3).
  const hydrated = useHydrated();
  const cast = useQuery(charactersQuery);
  const characters = hydrated ? (cast.data ?? null) : null;

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl md:text-5xl">Music and voices</h1>
          <p className="text-sm text-muted-foreground">
            Score your scenes and give your characters a voice. Every clip is kept.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/create?tab=audio">
            <Sparkles aria-hidden="true" /> Open audio in Quick create
          </Link>
        </Button>
      </header>

      {/* Outside the grid so the live region never takes a cell. */}
      {library.data ? <ProgressAnnouncer clips={library.data.clips} /> : null}

      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (isAudioTab(next)) void setTab(next);
        }}
      >
        <TabsList aria-label="Make">
          <TabsTrigger value="music">
            <Music aria-hidden="true" /> Music
          </TabsTrigger>
          <TabsTrigger value="voices">
            <Mic aria-hidden="true" /> Voices
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {library.isError ? (
        <Card className="flex flex-col items-start gap-4 p-6">
          <p className="text-sm">
            Your music and voices did not load. Nothing is lost; check your connection and try
            again.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              void library.refetch();
            }}
          >
            Try again
          </Button>
        </Card>
      ) : !library.data ? (
        <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-2" aria-busy="true">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4 md:gap-8">
            {tab === "music" ? (
              <MusicComposer />
            ) : (
              <>
                <SpeechComposer voices={library.data.voices} characters={characters} />
                <VoiceLibrary voices={library.data.voices} characters={characters} />
              </>
            )}
          </div>
          <AudioLibrary clips={library.data.clips} voices={library.data.voices} />
        </div>
      )}
    </div>
  );
}
