import { type NextRequest } from "next/server";

import { StylePresetDraftSchema } from "@/features/desk/schema";
import { deleteStyle, editStyle } from "@/features/desk/server";

import { invalid, respond } from "../../_respond";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/desk/styles/[id]">) {
  const { id } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = StylePresetDraftSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  return respond(editStyle(id, parsed.data));
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/desk/styles/[id]">) {
  const { id } = await ctx.params;
  return respond(deleteStyle(id));
}
