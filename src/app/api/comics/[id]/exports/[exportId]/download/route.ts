import { exportDownload } from "../../../../_lib/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/comics/[id]/exports/[exportId]/download">,
) {
  const { id, exportId } = await ctx.params;
  const file = exportDownload(id, exportId);
  if (!file) {
    return Response.json(
      { error: "That export is not ready, or its link expired." },
      { status: 404 },
    );
  }
  return new Response(file.body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${file.fileName}"`,
    },
  });
}
