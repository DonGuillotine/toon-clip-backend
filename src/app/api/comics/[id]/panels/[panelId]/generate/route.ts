import { ComicPageSchema } from "@/features/comics/schema";

import { generatePanel } from "../../../../_lib/store";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/comics/[id]/panels/[panelId]/generate">,
) {
  const { id, panelId } = await ctx.params;
  const result = generatePanel(id, panelId);
  if (!result) return Response.json({ error: "No comic page with that id." }, { status: 404 });
  if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
  return Response.json(ComicPageSchema.parse(result.page), { status: 202 });
}
