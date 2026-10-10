"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { LAYOUTS, panelCount } from "../layouts";
import { useCreateComic } from "../mutations";
import { COMIC_LAYOUTS, type ComicLayout, TITLE_MAX } from "../schema";
import { LayoutDiagram } from "./layout-diagram";

function isLayout(value: string): value is ComicLayout {
  return COMIC_LAYOUTS.some((layout) => layout === value);
}

/** Pick a template of 1 to 6 panels and a title, then open the new page. */
export function NewPageDialog() {
  const router = useRouter();
  const create = useCreateComic();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [layout, setLayout] = useState<ComicLayout>("grid-four");
  const trimmed = title.trim();

  const submit = () => {
    if (trimmed === "") return;
    create.mutate(
      { title: trimmed, layout },
      {
        onSuccess: (page) => {
          setOpen(false);
          setTitle("");
          router.push(`/comics/${page.id}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden="true" /> New page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New comic page</DialogTitle>
          <DialogDescription>
            Pick a template. Every panel gets its own prompt, takes and bubbles.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              value={title}
              maxLength={TITLE_MAX}
              placeholder="For example: Market chase, page 2"
              onChange={(event) => {
                setTitle(event.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span id={`${titleId}-layout`} className="text-sm font-medium">
              Template
            </span>
            <RadioGroup
              aria-labelledby={`${titleId}-layout`}
              value={layout}
              onValueChange={(next) => {
                if (isLayout(next)) setLayout(next);
              }}
              className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 sm:grid-cols-4"
            >
              {COMIC_LAYOUTS.map((option) => {
                const meta = LAYOUTS[option];
                const id = `${titleId}-${option}`;
                const count = panelCount(option);
                return (
                  <Label
                    key={option}
                    htmlFor={id}
                    className="flex cursor-pointer flex-col items-stretch gap-2 rounded-sm p-2 hover:bg-card has-data-checked:bg-card"
                  >
                    <span className="flex items-center gap-2">
                      <RadioGroupItem id={id} value={option} />
                      <span className="text-sm">{meta.label}</span>
                    </span>
                    <LayoutDiagram layout={option} className="w-full rounded-xs bg-card" />
                    <span className="text-xs leading-snug font-normal text-muted-foreground">
                      {count === 1 ? "1 panel" : `${String(count)} panels`}. {meta.description}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={trimmed === "" || create.isPending}>
              {create.isPending ? "Creating page" : "Create page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
