import { ComicActionSchema, ComicPageSchema } from "@/features/comics/schema";

import { act } from "../../_lib/store";

export async function POST(request: Request, ctx: RouteContext<"/api/comics/[id]/actions">) {
  const { id } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  const action = ComicActionSchema.safeParse(body);
  if (!action.success) {
    return Response.json({ error: "That edit is not one the page knows." }, { status: 400 });
  }
  const result = act(id, action.data);
  if (!result) return Response.json({ error: "No comic page with that id." }, { status: 404 });
  if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
  return Response.json(ComicPageSchema.parse(result.page));
}
