"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { normaliseHex } from "../library";
import { type Swatch } from "../schema";

/**
 * Rows of colours: a preview chip, the hex, and (for desk palettes) what the
 * colour is for. The hex is kept as typed until it leaves the field, then
 * tidied to `#rrggbb`; a value that is not a colour shows no chip and the
 * form's validation names the problem.
 */
export function SwatchEditor({
  swatches,
  onChange,
  showRoles,
  max,
  disabled = false,
  idPrefix,
}: {
  readonly swatches: readonly Swatch[];
  readonly onChange: (swatches: Swatch[]) => void;
  readonly showRoles: boolean;
  readonly max: number;
  readonly disabled?: boolean;
  /** Unique per editor, so every field has a stable accessible name. */
  readonly idPrefix: string;
}) {
  const replace = (index: number, next: Swatch) => {
    onChange(swatches.map((swatch, i) => (i === index ? next : swatch)));
  };

  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {swatches.map((swatch, index) => {
          const valid = normaliseHex(swatch.hex);
          const number = String(index + 1);
          return (
            <li
              // Swatches have no id of their own; position is their identity here.
              key={index}
              className="flex items-center gap-1 rounded-sm bg-card p-1"
            >
              <span
                aria-hidden="true"
                className="size-9 shrink-0 rounded-full bg-muted tone-dots [--tone-ink:var(--comic-faint)]"
                // The creator's colour, drawn as their own data.
                style={
                  valid === null ? undefined : { backgroundColor: valid, backgroundImage: "none" }
                }
              />
              <Input
                id={`${idPrefix}-hex-${number}`}
                aria-label={`Colour ${number}, hex`}
                aria-invalid={valid === null}
                value={swatch.hex}
                disabled={disabled}
                spellCheck={false}
                className="w-28 font-mono uppercase"
                onChange={(event) => {
                  replace(index, { ...swatch, hex: event.target.value });
                }}
                onBlur={() => {
                  if (valid !== null && valid !== swatch.hex)
                    replace(index, { ...swatch, hex: valid });
                }}
              />
              {showRoles ? (
                <Input
                  id={`${idPrefix}-role-${number}`}
                  aria-label={`Colour ${number}, role`}
                  placeholder="Role, for example Skin"
                  value={swatch.role}
                  maxLength={24}
                  disabled={disabled}
                  className="min-w-0 flex-1"
                  onChange={(event) => {
                    replace(index, { ...swatch, role: event.target.value });
                  }}
                />
              ) : (
                <span className="flex-1" />
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove colour ${number}`}
                disabled={disabled || swatches.length <= 1}
                onClick={() => {
                  onChange(swatches.filter((_, i) => i !== index));
                }}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        disabled={disabled || swatches.length >= max}
        onClick={() => {
          onChange([...swatches, { hex: swatches.at(-1)?.hex ?? "#888888", role: "" }]);
        }}
      >
        <Plus aria-hidden="true" />
        {swatches.length >= max ? `Up to ${String(max)} colours` : "Add colour"}
      </Button>
    </div>
  );
}
