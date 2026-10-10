import { jobsFixture } from "@/features/jobs/mocks";
import { JobsSchema } from "@/features/jobs/schema";

export function GET(): Response {
  return Response.json(JobsSchema.parse(jobsFixture));
}
