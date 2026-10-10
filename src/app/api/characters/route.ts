import { charactersFixture } from "@/features/characters/mocks";
import { CharactersSchema } from "@/features/characters/schema";

export function GET(): Response {
  return Response.json(CharactersSchema.parse(charactersFixture));
}
