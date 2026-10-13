"use client";

import { type ReactNode, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A button that opens the file picker. The file input is the kit's, kept off
 * screen; the button is what the keyboard and screen readers reach.
 */
export function FilePickButton({
  accept,
  multiple,
  disabled,
  onFiles,
  children,
  className,
  label,
}: {
  readonly accept: string;
  readonly multiple: boolean;
  readonly disabled: boolean;
  readonly onFiles: (files: readonly File[]) => void;
  readonly children: ReactNode;
  readonly className?: string;
  readonly label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
      <Button
        variant="secondary"
        disabled={disabled}
        aria-label={label}
        className={cn(className)}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {children}
      </Button>
    </>
  );
}
