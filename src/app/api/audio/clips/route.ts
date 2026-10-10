import { AudioClipSchema, AudioRequestSchema } from "@/features/audio/schema";

import { readJson, respond } from "../_lib/respond";
import { generateClip } from "../_lib/store";

export async function POST(request: Request): Promise<Response> {
  const parsed = AudioRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json({ error: "That request is missing something." }, { status: 400 });
  }
  return respond(generateClip(parsed.data), AudioClipSchema, 201);
}
