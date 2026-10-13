import { PreferencesSchema } from "@/features/account/schema";
import { updatePreferences } from "@/features/account/server";

export async function PUT(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = PreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Those preferences are not valid." }, { status: 400 });
  }
  return Response.json(updatePreferences(parsed.data));
}
