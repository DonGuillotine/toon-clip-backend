import { type NextRequest } from "next/server";

import { inBoardOrder } from "@/features/board/actions";
import { boardDownload } from "@/features/board/download";

import { readBoard } from "../../_store";

/** Download the selected tiles: one SVG, or a zip when there are several. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/boards/[id]/download">,
): Promise<Response> {
  const { id } = await params;
  const board = readBoard(id);
  if (board === null) {
    return Response.json({ error: "That board does not exist." }, { status: 404 });
  }
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .filter((value) => value !== "");
  const file = boardDownload(board.title, inBoardOrder(board, ids));
  if (file === null) {
    return Response.json({ error: "Select an image or video to download." }, { status: 400 });
  }
  return new Response(new Blob([file.data], { type: file.contentType }), {
    headers: {
      "content-type": file.contentType,
      "content-disposition": `attachment; filename="${file.fileName}"`,
    },
  });
}
