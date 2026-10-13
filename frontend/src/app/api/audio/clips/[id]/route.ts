import { AudioClipSchema, DeletedSchema, RenameClipRequestSchema } from "@/features/audio/schema";

import { readJson, respond } from "../../_lib/respond";
import { deleteClip, renameClip } from "../../_lib/store";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/audio/clips/[id]">,
): Promise<Response> {
  const { id } = await params;
  const parsed = RenameClipRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json({ error: "A name needs 1 to 60 characters." }, { status: 400 });
  }
  return respond(renameClip(id, parsed.data.title), AudioClipSchema);
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/audio/clips/[id]">,
): Promise<Response> {
  const { id } = await params;
  return respond(deleteClip(id), DeletedSchema);
}
