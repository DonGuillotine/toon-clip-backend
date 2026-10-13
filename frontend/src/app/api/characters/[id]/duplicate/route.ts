import { type NextRequest } from "next/server";

import { CharacterSheetSchema } from "@/features/characters/schema";
import { duplicateCharacter } from "@/features/characters/server";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/characters/[id]/duplicate">,
) {
  const { id } = await ctx.params;
  const result = duplicateCharacter(id);
  if (!result.ok) return Response.json({ error: result.message }, { status: result.status });
  return Response.json(CharacterSheetSchema.parse(result.sheet), { status: 201 });
}
