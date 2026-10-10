import { JobsSchema } from "@/features/jobs/schema";

import { listJobs } from "./_lib/store";

export function GET(): Response {
  return Response.json(JobsSchema.parse(listJobs()));
}
