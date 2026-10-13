import { SegmentFixSchema } from "@/features/segment-fixes/schema";

import { retryFix } from "../../_lib/store";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/segment-fixes/[id]/retry">,
): Promise<Response> {
  const { id } = await params;
  const fix = retryFix(id);
  if (fix === null) {
    return Response.json({ error: "That fix cannot be retried." }, { status: 404 });
  }
  return Response.json(SegmentFixSchema.parse(fix));
}
