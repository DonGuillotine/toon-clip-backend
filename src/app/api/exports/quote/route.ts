import { type NextRequest } from "next/server";

import { exportQuoteFixture } from "@/features/export/mocks";
import { ExportQuoteRequestSchema, ExportQuoteSchema } from "@/features/export/schema";

export function GET(request: NextRequest): Response {
  const parsed = ExportQuoteRequestSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return Response.json({ error: "That export cannot be priced." }, { status: 400 });
  }
  return Response.json(ExportQuoteSchema.parse(exportQuoteFixture()));
}
