"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Option<T> = { readonly value: T; readonly label: string };

type OptionMenuProps<T> = {
  /** What is being chosen, for the menu heading and the trigger's accessible name. */
  readonly label: string;
  readonly value: T;
  readonly options: readonly Option<T>[];
  readonly onChange: (value: T) => void;
};

/** A pill that opens a single-choice menu. The value is typed end to end. */
export function OptionMenu<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: OptionMenuProps<T>) {
  const current = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full" aria-label={`${label}: ${current?.label ?? ""}`}>
          {current?.label ?? label}
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(value)}
          onValueChange={(next) => {
            const picked = options.find((option) => String(option.value) === next);
            if (picked) onChange(picked.value);
          }}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
