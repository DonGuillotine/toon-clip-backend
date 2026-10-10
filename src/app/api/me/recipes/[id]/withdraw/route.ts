import { RecipeSchema } from "@/features/account/schema";
import { withdrawRecipe } from "@/features/account/server";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/me/recipes/[id]/withdraw">,
): Promise<Response> {
  const { id } = await params;
  const outcome = withdrawRecipe(id);
  if (!outcome.ok) return Response.json({ error: outcome.message }, { status: outcome.status });
  return Response.json(RecipeSchema.parse(outcome.recipe));
}
