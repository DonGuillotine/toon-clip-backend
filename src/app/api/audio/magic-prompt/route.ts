import { improveMusicPrompt } from "@/features/audio/music-magic";
import { MusicMagicPromptRequestSchema } from "@/features/audio/schema";

import { readJson } from "../_lib/respond";

export async function POST(request: Request): Promise<Response> {
  const parsed = MusicMagicPromptRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json({ error: "Describe the music first." }, { status: 400 });
  }
  return Response.json(improveMusicPrompt(parsed.data));
}
