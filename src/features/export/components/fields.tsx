"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type Choice<T> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
};

/** A labelled single choice drawn as a row of toggles. The value is typed end to end. */
export function ChoiceField<T extends string | number>({
  label,
  hint,
  value,
  choices,
  onChange,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly value: T;
  readonly choices: readonly Choice<T>[];
  readonly onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      <span id={id} className="text-sm font-medium">
        {label}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        aria-labelledby={id}
        value={String(value)}
        onValueChange={(next) => {
          const choice = choices.find((item) => String(item.value) === next);
          if (choice) onChange(choice.value);
        }}
        className="flex-wrap"
      >
        {choices.map((choice) => (
          <ToggleGroupItem
            key={String(choice.value)}
            value={String(choice.value)}
            disabled={choice.disabled ?? false}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {choice.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint === undefined ? null : <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** An on or off option with its label. */
export function SwitchField({
  label,
  hint,
  checked,
  disabled = false,
  onChange,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        {hint === undefined ? null : <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
