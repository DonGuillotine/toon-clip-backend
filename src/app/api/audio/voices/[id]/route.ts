import { DeletedSchema, UpdateVoiceRequestSchema, VoiceSchema } from "@/features/audio/schema";

import { readJson, respond } from "../../_lib/respond";
import { deleteVoice, updateVoice } from "../../_lib/store";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/audio/voices/[id]">,
): Promise<Response> {
  const { id } = await params;
  const parsed = UpdateVoiceRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json({ error: "Those voice changes are not valid." }, { status: 400 });
  }
  return respond(updateVoice(id, parsed.data), VoiceSchema);
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/audio/voices/[id]">,
): Promise<Response> {
  const { id } = await params;
  return respond(deleteVoice(id), DeletedSchema);
}
