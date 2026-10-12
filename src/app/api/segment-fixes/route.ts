import { type NextRequest } from "next/server";

import { ApiIdSchema } from "@/features/catalog/schema";
import { SegmentFixRequestSchema } from "@/features/segment-fixes/schema";

import { createFix, listFixes } from "./_lib/store";

/** Dev mode only: fixture segment fixes (`src/features/segment-fixes/schema.ts`). */

export function GET(request: NextRequest): Response {
  const projectId = ApiIdSchema.safeParse(request.nextUrl.searchParams.get("projectId"));
  if (!projectId.success) {
    return Response.json({ error: "Say which project to list fixes for." }, { status: 400 });
  }
  return Response.json(listFixes(projectId.data));
}

export async function POST(request: NextRequest): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = SegmentFixRequestSchema.safeParse(body);
  if (!parsed.success || parsed.data.endSeconds <= parsed.data.startSeconds) {
    return Response.json(
      { error: "Describe the change in a few words, then try again." },
      { status: 422 },
    );
  }
  const fix = createFix(parsed.data, request.headers.get("idempotency-key"));
  return Response.json(fix, { status: 201 });
}
