import { type CoverArt } from "@/features/storyboards/schema";

/**
 * Placeholder art as standalone SVG documents, for downloads and for frames
 * handed between screens until takes have real media.
 *
 * A standalone file cannot read the app's CSS custom properties, so these
 * carry the `--comic-*` values from `globals.css`, written out in the same
 * oklch form. Keep them in step with the tokens.
 */
const INK = "oklch(0.17 0.006 270)";
const PAPER = "oklch(1 0 0)";
const TONE = "oklch(0.89 0.004 270)";
const SPOT = "oklch(0.9 0.185 100)";
const SKY = "oklch(0.74 0.135 228)";

const WIDTH = 640;
const HEIGHT = 360;

export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function composition(art: CoverArt): string {
  const full = `width="${String(WIDTH)}" height="${String(HEIGHT)}"`;
  switch (art) {
    case "burst":
      return [
        `<rect ${full} fill="${SPOT}" opacity="0.3"/>`,
        `<circle cx="243" cy="200" r="90" fill="${PAPER}" stroke="${INK}" stroke-width="6"/>`,
      ].join("");
    case "rush":
      return [
        `<rect x="384" width="256" height="${String(HEIGHT)}" fill="${SKY}" opacity="0.4"/>`,
        `<rect x="500" y="140" width="24" height="220" fill="${PAPER}" stroke="${INK}" stroke-width="6"/>`,
        `<rect x="420" y="210" width="40" height="150" fill="${INK}"/>`,
      ].join("");
    case "dusk":
      return [
        `<rect ${full} fill="${TONE}"/>`,
        `<circle cx="320" cy="266" r="100" fill="${SPOT}" stroke="${INK}" stroke-width="6"/>`,
        `<rect y="266" width="${String(WIDTH)}" height="94" fill="${PAPER}" stroke="${INK}" stroke-width="6"/>`,
      ].join("");
    case "rain":
      return [
        `<rect ${full} fill="${INK}"/>`,
        `<rect x="77" y="43" width="486" height="274" rx="12" fill="none" stroke="${PAPER}" stroke-width="6"/>`,
        `<line x1="320" y1="43" x2="320" y2="317" stroke="${PAPER}" stroke-width="6"/>`,
      ].join("");
  }
}

function caption(text: string): string {
  return [
    `<rect x="16" y="${String(HEIGHT - 60)}" width="${String(WIDTH - 32)}" height="44" rx="8" fill="${PAPER}"/>`,
    `<text x="32" y="${String(HEIGHT - 32)}" font-family="sans-serif" font-size="18" fill="${INK}">`,
    escapeXml(text),
    `</text>`,
  ].join("");
}

function document(title: string, body: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(WIDTH)}" height="${String(HEIGHT)}" viewBox="0 0 ${String(WIDTH)} ${String(HEIGHT)}">`,
    `<title>${escapeXml(title)}</title>`,
    `<rect width="${String(WIDTH)}" height="${String(HEIGHT)}" fill="${PAPER}"/>`,
    body,
    `</svg>`,
  ].join("\n");
}

/** A cover composition with a caption. 16:9. */
export function artSvg(art: CoverArt, label: string): string {
  return document(label, composition(art) + caption(label));
}

/** A character sheet card: the palette as swatches and the name. 16:9. */
export function characterSvg(name: string, palette: readonly string[]): string {
  const swatch = (WIDTH - 64) / Math.max(1, palette.length);
  const swatches = palette
    .map(
      (colour, index) =>
        `<rect x="${String(32 + index * swatch)}" y="32" width="${String(swatch - 8)}" height="200" rx="12" fill="${escapeXml(colour)}"/>`,
    )
    .join("");
  return document(
    `${name} character sheet`,
    swatches + caption(`${name}, character sheet (sample)`),
  );
}

/** Where the app serves a cover composition as a frame image. */
export function artFrameUrl(art: CoverArt, label: string): string {
  return `/api/frames?${new URLSearchParams({ art, label }).toString()}`;
}

/** Where the app serves a character sheet as a frame image. */
export function characterFrameUrl(characterId: string): string {
  return `/api/frames?${new URLSearchParams({ character: characterId }).toString()}`;
}
