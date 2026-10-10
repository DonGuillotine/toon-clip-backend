import { retryGeneration } from "@/features/create/mocks";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/generations/[id]/retry">,
): Promise<Response> {
  const { id } = await params;
  const generation = retryGeneration(id);
  if (!generation) {
    return Response.json({ error: "Only a failed generation can be retried." }, { status: 404 });
  }
  return Response.json(generation);
}
