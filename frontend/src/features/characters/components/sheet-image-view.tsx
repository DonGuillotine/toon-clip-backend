import Image from "next/image";

import { CoverArt } from "@/components/comic/cover-art";
import { cn } from "@/lib/utils";

import { type SheetImage } from "../schema";

/**
 * One sheet image at tile size (160 x 100). An upload shows itself; a
 * placeholder is screentoned cover art, which DESIGN.md reserves for stand-in
 * art, so it reads as "not the real drawing yet".
 */
export function SheetImageView({
  image,
  className,
}: {
  readonly image: SheetImage;
  readonly className?: string;
}) {
  return (
    <div
      className={cn("relative h-25 w-40 shrink-0 overflow-hidden rounded-xs bg-muted", className)}
    >
      {image.source.kind === "upload" ? (
        <Image
          src={image.source.url}
          alt={image.label}
          fill
          unoptimized
          sizes="160px"
          className="object-cover"
        />
      ) : (
        <CoverArt
          art={image.source.art}
          sfx={null}
          className="h-50 w-80 origin-top-left scale-50"
        />
      )}
    </div>
  );
}
