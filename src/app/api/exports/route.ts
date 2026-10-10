import { type NextRequest } from "next/server";

import { insufficientCredits, refundCredits, spendCredits } from "@/features/account/server";
import { exportQuoteFixture, startExportFixture } from "@/features/export/mocks";
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

/** Start an export, charged at the quoted price (the fixture prices exports at 0). */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json();
  const parsed = ExportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Those export options are not valid." }, { status: 400 });
  }
  if (getExports(parsed.data.storyboardId) === null) {
    return Response.json({ error: "That storyboard does not exist." }, { status: 404 });
  }
  const label = parsed.data.kind === "psd" ? "layered PSD" : "video";
  const outcome = spendCredits(exportQuoteFixture().credits, `Export ${label}`);
  if (!outcome.ok) return insufficientCredits(outcome.message);
  const result = startExportFixture(parsed.data);
  if (!result.ok) {
    refundCredits(exportQuoteFixture().credits, `Refund: ${label} export did not start`);
    return Response.json({ error: result.message }, { status: result.status });
  }
  return Response.json(ExportJobSchema.parse(result.job), { status: 201 });
}
