import { connection } from "next/server";

import { RecipeSchema, RecipeSubmissionSchema, RecipesSchema } from "@/features/account/schema";
import { getRecipes, submitRecipe } from "@/features/account/server";

/** Read per request: the store changes as credits move. */
export async function GET(): Promise<Response> {
  await connection();
  return Response.json(RecipesSchema.parse(getRecipes()));
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = RecipeSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That recipe is missing something." }, { status: 400 });
  }
  const outcome = submitRecipe(parsed.data);
  if (!outcome.ok) return Response.json({ error: outcome.message }, { status: outcome.status });
  return Response.json(RecipeSchema.parse(outcome.recipe), { status: 201 });
}
