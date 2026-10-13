import { AudioClipSchema } from "@/features/audio/schema";

import { respond } from "../../../_lib/respond";
import { retryClip } from "../../../_lib/store";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/audio/clips/[id]/retry">,
): Promise<Response> {
  const { id } = await params;
  return respond(retryClip(id), AudioClipSchema);
}
