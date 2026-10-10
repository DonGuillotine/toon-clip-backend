import { connection } from "next/server";

import {
  CharacterDraftSchema,
  CharacterSheetSchema,
  CharactersSchema,
} from "@/features/characters/schema";
import { createCharacter, listCharacters } from "@/features/characters/server";

export async function GET(): Promise<Response> {
  await connection();
  return Response.json(CharactersSchema.parse(listCharacters()));
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = CharacterDraftSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "That sheet is missing something." },
      { status: 400 },
    );
  }
  return Response.json(CharacterSheetSchema.parse(createCharacter(parsed.data)), { status: 201 });
}
