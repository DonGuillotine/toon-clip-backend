import { connection, type NextRequest } from "next/server";

import { CharacterDraftSchema, CharacterSheetSchema } from "@/features/characters/schema";
import {
  deleteCharacter,
  getCharacter,
  type SheetWriteResult,
  updateCharacter,
} from "@/features/characters/server";

function respond(result: SheetWriteResult): Response {
  if (!result.ok) return Response.json({ error: result.message }, { status: result.status });
  return Response.json(CharacterSheetSchema.parse(result.sheet));
}

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/characters/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const sheet = getCharacter(id);
  if (!sheet) return Response.json({ error: "No character with that id." }, { status: 404 });
  return Response.json(CharacterSheetSchema.parse(sheet));
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = CharacterDraftSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "That sheet is missing something." },
      { status: 400 },
    );
  }
  return respond(updateCharacter(id, parsed.data));
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  return respond(deleteCharacter(id));
}
