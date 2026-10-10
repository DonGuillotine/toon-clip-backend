"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

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
              <div key={character.id} className="flex items-center gap-3">
                <FanLabel
                  title={character.isSample ? `${character.name} (sample)` : character.name}
                  detail={character.look}
                />
                <span className="rounded-full bg-card p-1 shadow-overlay">
                  <Portrait character={character} />
                </span>
              </div>
            )),
            <Button
              key="new"
              variant="secondary"
              size="sm"
              className="bg-popover shadow-overlay hover:bg-accent"
              onClick={() => {
                toast("The character sheet editor is not built yet.");
              }}
            >
              <Plus aria-hidden="true" /> New character
            </Button>,
          ]}
        </DockFan>
      )}
    </DockItem>
  );
}
