import { charactersFixture } from "@/features/characters/mocks";
import { improvePrompt } from "@/features/magic-prompt/mocks";
import { MagicPromptRequestSchema } from "@/features/magic-prompt/schema";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = MagicPromptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Write a prompt first." }, { status: 400 });
  }
  const cast = charactersFixture.filter((character) =>
    parsed.data.characterIds.includes(character.id),
  );
  return Response.json(improvePrompt(parsed.data, cast));
}
