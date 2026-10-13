import { canAfford, insufficientCredits, spendCredits } from "@/features/account/server";
import { listGenerations, retryGeneration } from "@/features/create/mocks";

/** Retry a failed generation. Its first charge was refunded, so this charges again. */
export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/generations/[id]/retry">,
): Promise<Response> {
  const { id } = await params;
  const failed = listGenerations().find((item) => item.id === id && item.status === "failed");
  if (!failed) {
    return Response.json({ error: "Only a failed generation can be retried." }, { status: 404 });
  }
  if (!canAfford(failed.credits)) return insufficientCredits();
  const generation = retryGeneration(id);
  if (!generation) {
    return Response.json({ error: "Only a failed generation can be retried." }, { status: 404 });
  }
  spendCredits(generation.credits, `Retry quick create ${generation.tab}`);
  return Response.json(generation);
}
