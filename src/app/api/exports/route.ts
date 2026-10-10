import { type NextRequest } from "next/server";

import { startExportFixture } from "@/features/export/mocks";
import {
  ExportJobSchema,
  ExportRequestSchema,
  ExportsResponseSchema,
} from "@/features/export/schema";
import { getExports } from "@/features/export/server";

export function GET(request: NextRequest): Response {
  const storyboardId = request.nextUrl.searchParams.get("storyboardId");
  if (storyboardId === null) {
    return Response.json({ error: "Say which storyboard to list exports for." }, { status: 400 });
  }
  const data = getExports(storyboardId);
  if (data === null) {
    return Response.json({ error: "That storyboard does not exist." }, { status: 404 });
  }
  return Response.json(ExportsResponseSchema.parse(data));
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json();
  const parsed = ExportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Those export options are not valid." }, { status: 400 });
  }
  const job = startExportFixture(parsed.data);
  if (job === null) {
    return Response.json({ error: "That storyboard does not exist." }, { status: 404 });
  }
  return Response.json(ExportJobSchema.parse(job), { status: 201 });
}
