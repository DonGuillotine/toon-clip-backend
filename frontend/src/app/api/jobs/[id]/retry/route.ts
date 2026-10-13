import { JobSchema } from "@/features/jobs/schema";

import { retry } from "../../_lib/store";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/jobs/[id]/retry">,
): Promise<Response> {
  const { id } = await params;
  const job = retry(id);
  if (job === null) {
    return Response.json({ error: "That job cannot be retried." }, { status: 404 });
  }
  return Response.json(JobSchema.parse(job));
}
