import { retryExportFixture } from "@/features/export/mocks";
import { ExportJobSchema } from "@/features/export/schema";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/exports/[id]/retry">,
): Promise<Response> {
  const { id } = await params;
  const job = retryExportFixture(id);
  if (job === null) {
    return Response.json({ error: "That export does not exist." }, { status: 404 });
  }
  return Response.json(ExportJobSchema.parse(job));
}
