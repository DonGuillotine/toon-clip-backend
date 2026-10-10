"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

import { DockCount, DockFan, DockItem, FanLabel } from "@/components/dock/dock";
import { Button } from "@/components/ui/button";

import { charactersQuery } from "../queries";

import { Portrait } from "./portrait";

/** The cast: a circle showing the lead character; hover fans out everyone. */
export function CastDockItem() {
  const { data } = useQuery(charactersQuery);
  const lead = data?.[0];

  return (
    <DockItem
      bare
      label={data ? `Your cast, ${String(data.length)} characters` : "Your cast"}
      icon={
        lead ? (
          <>
            <Portrait character={lead} size="sm" />
            <DockCount count={data.length} />
          </>
        ) : (
          <Users aria-hidden="true" className="size-4 text-muted-foreground" />
        )
      }
    >
      {data === undefined ? null : (
        <DockFan>
          {[
            ...data.map((character) => (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className="flex items-center gap-3 rounded-full"
              >
                <FanLabel
                  title={character.isSample ? `${character.name} (sample)` : character.name}
                  detail={character.look}
                />
                <span className="rounded-full bg-card p-1 shadow-overlay">
                  <Portrait character={character} />
                </span>
              </Link>
            )),
            <Button
              key="new"
              asChild
              variant="secondary"
              size="sm"
              className="bg-popover shadow-overlay hover:bg-accent"
            >
              <Link href="/characters/new">
                <Plus aria-hidden="true" /> New character
              </Link>
            </Button>,
          ]}
        </DockFan>
      )}
    </DockItem>
  );
}
