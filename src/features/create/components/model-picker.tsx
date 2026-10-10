"use client";

import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CAPABILITY_LABEL } from "../capabilities";
import { type Model } from "../schema";

export function CapabilityBadges({ model }: { readonly model: Model }) {
  if (model.capabilities.length === 0) {
    return <span className="text-xs text-muted-foreground">No extra inputs</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {model.capabilities.map((capability) => (
        <Badge key={capability}>{CAPABILITY_LABEL[capability]}</Badge>
      ))}
    </span>
  );
}

/** Model selector with the capability matrix from the API shown as badges. */
export function ModelPicker({
  models,
  value,
  onChange,
}: {
  readonly models: readonly Model[];
  readonly value: Model;
  readonly onChange: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2.5"
          aria-label={`Model: ${value.name}`}
        >
          {value.name}
          <ChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64">
        <DropdownMenuLabel>Model</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value.id} onValueChange={onChange}>
          {models.map((model) => (
            <DropdownMenuRadioItem key={model.id} value={model.id} className="items-start py-2">
              <span className="flex flex-col gap-1">
                <span>
                  {model.name} <span className="text-xs text-muted-foreground">{model.vendor}</span>
                </span>
                <CapabilityBadges model={model} />
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
