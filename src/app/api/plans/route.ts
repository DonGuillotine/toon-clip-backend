import { createPlan } from "@/features/create/mocks";
import { PlanRequestSchema } from "@/features/create/schema";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Describe the idea first." }, { status: 400 });
  }
  return Response.json(createPlan(parsed.data), { status: 201 });
}
