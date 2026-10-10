import { ComicExportSchema } from "@/features/comics/schema";

import { retryExport } from "../../../../_lib/store";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/comics/[id]/exports/[exportId]/retry">,
) {
  const { id, exportId } = await ctx.params;
  const job = retryExport(id, exportId);
  if (!job) return Response.json({ error: "No export with that id." }, { status: 404 });
  return Response.json(ComicExportSchema.parse(job));
}
