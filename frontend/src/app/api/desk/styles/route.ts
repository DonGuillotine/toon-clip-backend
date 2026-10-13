import { DeskLibrarySchema, StylePresetDraftSchema } from "@/features/desk/schema";
import { createStyle } from "@/features/desk/server";

import { invalid } from "../_respond";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = StylePresetDraftSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  return Response.json(DeskLibrarySchema.parse(createStyle(parsed.data)), { status: 201 });
}
