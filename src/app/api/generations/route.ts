import { listGenerations, submitGeneration } from "@/features/create/mocks";
import { GenerationRequestSchema } from "@/features/create/schema";

export function GET(): Response {
  return Response.json(listGenerations());
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = GenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That request is missing something." }, { status: 400 });
  }
  const result = submitGeneration(parsed.data);
  if (!result.ok) return Response.json({ error: result.message }, { status: 422 });
  return Response.json(result.generation, { status: 201 });
}
