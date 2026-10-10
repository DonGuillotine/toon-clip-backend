import { type CoverArt } from "@/features/storyboards/schema";
import { cn } from "@/lib/utils";

type PanelArtProps = {
  readonly art: CoverArt;
  readonly sfx: string | null;
  readonly className?: string;
};

/**
 * Placeholder cover art, drawn in screentone, speed lines and SFX lettering
 * until a storyboard has a real take to show. Purely decorative.
 */
export function PanelArt({ art, sfx, className }: PanelArtProps) {
  return (
    <div aria-hidden="true" className={cn("relative isolate overflow-hidden bg-sheet", className)}>
      <Composition art={art} />
      {sfx === null ? null : (
        <span
          className={cn(
            "sfx absolute z-10 text-5xl text-spot select-none sm:text-6xl",
            art === "burst" && "end-[8%] top-[18%] -rotate-8",
            art === "rush" && "start-[8%] bottom-[22%] -skew-x-12 -rotate-3",
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

function Composition({ art }: { readonly art: CoverArt }) {
  switch (art) {
    case "burst":
      return (
        <>
          <div className="absolute inset-0 bg-spot/30" />
          <div className="focus-lines absolute inset-0 [--focus-x:38%] [--focus-y:58%]" />
          <div className="absolute start-[38%] top-[58%] size-24 -translate-1/2 rounded-full border-3 border-ink bg-sheet" />
          <div className="tone-dots absolute start-[38%] top-[58%] size-24 -translate-1/2 rounded-full [--tone-size:5px] [mask-image:linear-gradient(135deg,transparent_45%,black_70%)]" />
        </>
      );
    case "rush":
      return (
        <>
          <div className="speed-lines absolute inset-0 [--speed-angle:0deg] [--speed-gap:9px] [mask-image:linear-gradient(90deg,black,transparent_75%)]" />
          <div className="absolute inset-y-0 end-0 w-2/5 bg-sky/40" />
          <div className="tone-fade absolute inset-y-0 end-0 w-2/5 [--tone-angle:270deg] [--tone-size:7px]" />
          <div className="absolute end-[18%] bottom-0 h-3/5 w-6 border-3 border-b-0 border-ink bg-sheet" />
          <div className="absolute end-[30%] bottom-0 h-2/5 w-10 border-3 border-b-0 border-ink bg-ink" />
        </>
      );
    case "dusk":
      return (
        <>
          <div className="tone-fade absolute inset-0 [--tone-angle:180deg] [--tone-size:6px]" />
          <div className="absolute start-1/2 bottom-[26%] size-28 -translate-x-1/2 translate-y-1/2 rounded-full border-3 border-ink bg-spot" />
          <div className="absolute inset-x-0 bottom-0 h-[26%] border-t-3 border-ink bg-sheet" />
          <div className="speed-lines absolute inset-x-0 bottom-0 h-[26%] [--speed-angle:0deg] [--speed-gap:14px] [--speed-weight:1px] opacity-40" />
          <div className="absolute start-[14%] bottom-[26%] h-14 w-16 border-3 border-b-0 border-ink bg-ink" />
          <div className="absolute end-[16%] bottom-[26%] h-10 w-20 border-3 border-b-0 border-ink bg-tone-2" />
        </>
      );
    case "rain":
      return (
        <>
          <div className="absolute inset-0 bg-ink" />
          <div className="speed-lines absolute inset-0 [--speed-angle:100deg] [--speed-gap:11px] [--speed-ink:var(--sky)] [--speed-weight:1px] opacity-70" />
          <div className="absolute inset-[12%] rounded-md border-3 border-sheet" />
          <div className="absolute inset-y-[12%] start-1/2 w-0 border-s-3 border-sheet" />
          <div className="tone-dots absolute inset-x-0 bottom-0 h-1/3 [--tone-ink:var(--sky)] [--tone-size:7px] [mask-image:linear-gradient(transparent,black)]" />
        </>
      );
  }
}
