import { FeedbackReceiptSchema, FeedbackSchema } from "@/features/account/schema";
import { recordFeedback } from "@/features/account/server";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Pick a topic and write a message." }, { status: 400 });
  }
  return Response.json(FeedbackReceiptSchema.parse(recordFeedback(parsed.data)), { status: 201 });
}
