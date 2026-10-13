import { type NextRequest } from "next/server";

import { charactersFixture } from "@/features/characters/mocks";
import { CoverArtSchema } from "@/features/storyboards/schema";
import { artSvg, characterSvg } from "@/lib/art-svg";

/**
 * Frame images handed between screens: a still from a timeline shot or a
 * board tile (`?art=&label=`), or a character sheet (`?character=`). Sample
 * art until takes and sheets have real media.
 */
export function GET(request: NextRequest): Response {
  const params = request.nextUrl.searchParams;
  const characterId = params.get("character");
  let svg: string | null = null;

  if (characterId !== null) {
    const character = charactersFixture.find((item) => item.id === characterId);
    if (character) svg = characterSvg(character.name, character.palette);
  } else {
    const art = CoverArtSchema.safeParse(params.get("art"));
    const label = params.get("label") ?? "Frame";
    if (art.success) svg = artSvg(art.data, label.slice(0, 80));
  }

  if (svg === null) {
    return Response.json({ error: "That frame does not exist." }, { status: 404 });
  }
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=3600",
    },
  });
}
