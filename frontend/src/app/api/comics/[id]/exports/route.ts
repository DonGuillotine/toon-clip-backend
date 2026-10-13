import { ComicExportRequestSchema, ComicExportSchema } from "@/features/comics/schema";

import { startExport } from "../../_lib/store";

export async function POST(request: Request, ctx: RouteContext<"/api/comics/[id]/exports">) {
  const { id } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = ComicExportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Those export options are not valid." }, { status: 400 });
  }
  const job = startExport(id, parsed.data);
  if (!job) return Response.json({ error: "No comic page with that id." }, { status: 404 });
  return Response.json(ComicExportSchema.parse(job), { status: 201 });
}
