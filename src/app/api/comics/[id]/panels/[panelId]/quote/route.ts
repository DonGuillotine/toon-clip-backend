import { PanelQuoteSchema } from "@/features/comics/schema";

import { quotePanel } from "../../../../_lib/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/comics/[id]/panels/[panelId]/quote">,
) {
  const { id, panelId } = await ctx.params;
  const credits = quotePanel(id, panelId);
  if (credits === undefined) {
    return Response.json({ error: "No panel with that id." }, { status: 404 });
  }
  return Response.json(PanelQuoteSchema.parse({ credits }));
}
