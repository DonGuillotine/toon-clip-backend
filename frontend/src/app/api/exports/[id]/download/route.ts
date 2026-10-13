import { type NextRequest } from "next/server";
import { z } from "zod";

import { exportDownloadFixture } from "@/features/export/mocks";

const PartSchema = z.enum(["main", "audio", "subtitles"]).catch("main");

/** The download link behind a ready export. Links expire after 7 days. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/exports/[id]/download">,
): Promise<Response> {
  const { id } = await params;
  const part = PartSchema.parse(request.nextUrl.searchParams.get("part") ?? "main");
  const file = exportDownloadFixture(id, part, Date.now());
  if (file === null) {
    return Response.json(
      { error: "That download is not ready, or its link has expired." },
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
