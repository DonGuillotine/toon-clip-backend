import { type NextRequest } from "next/server";

import { quoteFixture } from "@/features/create/mocks";
import { QuoteRequestSchema, QuoteSchema } from "@/features/create/schema";

export function GET(request: NextRequest): Response {
  const parsed = QuoteRequestSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json({ error: "That combination cannot be priced." }, { status: 400 });
  }
  return Response.json(QuoteSchema.parse(quoteFixture(parsed.data)));
}
