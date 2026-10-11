"use client";

import { AudioLines, Film, Image, type LucideIcon, Paperclip, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatSize } from "@/features/create/attachments";
import { useAttachmentsStore } from "@/features/create/attachments-store";
import { type ReferenceKind } from "@/features/create/schema";

const KIND_META = {
  image: { icon: Image, label: "Image" },
  video: { icon: Film, label: "Video" },
  audio: { icon: AudioLines, label: "Audio" },
} satisfies Record<ReferenceKind, { icon: LucideIcon; label: string }>;

/**
 * The attachments tray (spec 5, top bar): every file attached in Quick create
 * this session. Attach again sends one back to Quick create; Remove forgets it.
 */
export function AttachmentsTray() {
  const items = useAttachmentsStore((state) => state.items);
  const remove = useAttachmentsStore((state) => state.remove);
  const clear = useAttachmentsStore((state) => state.clear);
  const requestAttach = useAttachmentsStore((state) => state.requestAttach);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const label =
    items.length === 0 ? "Attachments, none yet" : `Attachments, ${String(items.length)}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className="relative">
          <Paperclip aria-hidden="true" />
          {items.length === 0 ? null : (
            <span
              aria-hidden="true"
              className="tabular absolute end-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-spot px-1 text-xs leading-none font-medium text-spot-foreground"
            >
              {items.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-2 p-2">
        <div className="flex min-h-9 items-center justify-between gap-2 ps-2">
          <h2 className="font-display text-xl">Attachments</h2>
          {items.length === 0 ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear();
              }}
            >
              Clear all
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Files you attach in Quick create this session show here, so you can use them again.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-md bg-muted p-1">
            {items.map((item) => {
              const meta = KIND_META[item.kind];
              const Icon = meta.icon;
              return (
                <li key={item.id} className="flex items-center gap-1 rounded-sm p-1 ps-2">
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {meta.label}, {formatSize(item.size)}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Attach ${item.name} again`}
                    onClick={() => {
                      requestAttach(item.id);
                      setOpen(false);
                      // Read at click time: usePathname would make every route dynamic.
                      if (window.location.pathname !== "/create") router.push("/create");
                      toast(`${item.name} is attached in Quick create.`);
                    }}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => {
                      remove(item.id);
                    }}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
