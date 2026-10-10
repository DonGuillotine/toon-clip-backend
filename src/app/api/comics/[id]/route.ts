import { ComicPageSchema } from "@/features/comics/schema";

import { deletePage, getPage } from "../_lib/store";

export async function GET(_request: Request, ctx: RouteContext<"/api/comics/[id]">) {
  const { id } = await ctx.params;
  const page = getPage(id);
  if (!page) return Response.json({ error: "No comic page with that id." }, { status: 404 });
  return Response.json(ComicPageSchema.parse(page));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/comics/[id]">) {
  const { id } = await ctx.params;
  if (!deletePage(id)) {
    return Response.json({ error: "No comic page with that id." }, { status: 404 });
  }
  return Response.json({ deleted: id });
}
