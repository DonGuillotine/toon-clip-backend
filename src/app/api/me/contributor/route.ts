import { ContributorUpdateSchema } from "@/features/account/schema";
import { setContributor } from "@/features/account/server";

export async function PUT(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = ContributorUpdateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Say on or off." }, { status: 400 });
  return Response.json(setContributor(parsed.data));
}
