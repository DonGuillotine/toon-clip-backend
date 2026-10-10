import { CreateVoiceRequestSchema, VoiceSchema } from "@/features/audio/schema";

import { readJson, respond } from "../_lib/respond";
import { createVoice } from "../_lib/store";

export async function POST(request: Request): Promise<Response> {
  const parsed = CreateVoiceRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json(
      { error: "A voice needs a name, a description or a sample, and your rights confirmed." },
      { status: 400 },
    );
  }
  return respond(createVoice(parsed.data), VoiceSchema, 201);
}
