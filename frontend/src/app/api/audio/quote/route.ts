import { type NextRequest } from "next/server";

import { quoteAudio } from "@/features/audio/mocks";
import { AudioQuoteRequestSchema, AudioQuoteSchema } from "@/features/audio/schema";

export function GET(request: NextRequest): Response {
  const parsed = AudioQuoteRequestSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return Response.json({ error: "That audio cannot be priced." }, { status: 400 });
  }
  return Response.json(AudioQuoteSchema.parse(quoteAudio(parsed.data)));
}
