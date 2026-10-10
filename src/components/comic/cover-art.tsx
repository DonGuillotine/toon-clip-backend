import { type CoverArt as CoverArtKind } from "@/features/storyboards/schema";
import { cn } from "@/lib/utils";

type CoverArtProps = {
  readonly art: CoverArtKind;
  readonly sfx: string | null;
  readonly className?: string;
};

/**
 * Placeholder cover art, drawn in screentone, speed lines and SFX lettering
 * until a storyboard has a real take to show. Purely decorative.
 *
 * This is illustration, not interface: it draws with the `comic-*` tokens and
 * its ink lines are part of the drawing, so the no-border rule does not apply.
 */
export function CoverArt({ art, sfx, className }: CoverArtProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative isolate overflow-hidden bg-comic-paper", className)}
    >
      <Composition art={art} />
      {sfx === null ? null : (
        <span
          className={cn(
            "absolute z-10 sfx text-5xl text-comic-spot select-none sm:text-6xl",
            art === "burst" && "end-[8%] top-[18%] -rotate-8",
            art === "rush" && "start-[8%] bottom-[22%] -rotate-3 -skew-x-12",
            art === "dusk" && "start-[10%] top-[20%] rotate-3",
            art === "rain" && "end-[10%] bottom-[24%] rotate-6",
          )}
        >
          {sfx}
        </span>
      )}
    </div>
  );
}

function Composition({ art }: { readonly art: CoverArtKind }) {
  switch (art) {
    case "burst":
      return (
        <>
          <div className="absolute inset-0 bg-comic-spot/30" />
          <div className="absolute inset-0 focus-lines [--focus-x:38%] [--focus-y:58%]" />
          <div className="absolute start-[38%] top-[58%] size-24 -translate-1/2 rounded-full border-3 border-comic-ink bg-comic-paper" />
          <div className="absolute start-[38%] top-[58%] size-24 -translate-1/2 rounded-full tone-dots [mask-image:linear-gradient(135deg,transparent_45%,black_70%)] [--tone-size:5px]" />
        </>
      );
    case "rush":
      return (
        <>
          <div className="absolute inset-0 speed-lines [mask-image:linear-gradient(90deg,black,transparent_75%)] [--speed-angle:0deg] [--speed-gap:9px]" />
          <div className="absolute inset-y-0 end-0 w-2/5 bg-comic-sky/40" />
          <div className="absolute inset-y-0 end-0 w-2/5 tone-fade [--tone-angle:270deg] [--tone-size:7px]" />
          <div className="absolute end-[18%] bottom-0 h-3/5 w-6 border-3 border-b-0 border-comic-ink bg-comic-paper" />
          <div className="absolute end-[30%] bottom-0 h-2/5 w-10 border-3 border-b-0 border-comic-ink bg-comic-ink" />
        </>
      );
    case "dusk":
      return (
        <>
          <div className="absolute inset-0 tone-fade [--tone-angle:180deg] [--tone-size:6px]" />
          <div className="absolute start-1/2 bottom-[26%] size-28 -translate-x-1/2 translate-y-1/2 rounded-full border-3 border-comic-ink bg-comic-spot" />
          <div className="absolute inset-x-0 bottom-0 h-[26%] border-t-3 border-comic-ink bg-comic-paper" />
          <div className="absolute inset-x-0 bottom-0 h-[26%] speed-lines opacity-40 [--speed-angle:0deg] [--speed-gap:14px] [--speed-weight:1px]" />
          <div className="absolute start-[14%] bottom-[26%] h-14 w-16 border-3 border-b-0 border-comic-ink bg-comic-ink" />
          <div className="absolute end-[16%] bottom-[26%] h-10 w-20 border-3 border-b-0 border-comic-ink bg-comic-tone" />
        </>
      );
    case "rain":
      return (
        <>
          <div className="absolute inset-0 bg-comic-ink" />
          <div className="absolute inset-0 speed-lines opacity-70 [--speed-angle:100deg] [--speed-gap:11px] [--speed-ink:var(--comic-sky)] [--speed-weight:1px]" />
          <div className="absolute inset-[12%] rounded-md border-3 border-comic-paper" />
          <div className="absolute inset-y-[12%] start-1/2 w-0 border-s-3 border-comic-paper" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 tone-dots [mask-image:linear-gradient(transparent,black)] [--tone-ink:var(--comic-sky)] [--tone-size:7px]" />
        </>
      );
  }
}
