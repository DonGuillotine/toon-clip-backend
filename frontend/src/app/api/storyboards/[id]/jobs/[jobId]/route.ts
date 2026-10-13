import { type NextRequest } from "next/server";
import { connection } from "next/server";

import { ShotJobSchema } from "@/features/storyboards/schema";

import { getJob } from "../../../_lib/store";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/storyboards/[id]/jobs/[jobId]">,
) {
  await connection();
  const { id, jobId } = await ctx.params;
  const job = getJob(id, jobId);
  if (!job) return Response.json({ error: "No job with that id." }, { status: 404 });
  return Response.json(ShotJobSchema.parse(job));
}
