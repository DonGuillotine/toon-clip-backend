import { connectAccountFixture, disconnectAccountFixture } from "@/features/export/mocks";
import { ConnectAccountRequestSchema, UploadAccountResponseSchema } from "@/features/export/schema";

/** Stand-in for the OAuth callback: the platform takes a moment to answer. */
const OAUTH_DELAY_MS = 900;

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = ConnectAccountRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "That account could not be connected." }, { status: 400 });
  }
  await new Promise((resolve) => setTimeout(resolve, OAUTH_DELAY_MS));
  const account = connectAccountFixture(parsed.data.handle);
  return Response.json(UploadAccountResponseSchema.parse({ account }));
}

export function DELETE(): Response {
  disconnectAccountFixture();
  return Response.json(UploadAccountResponseSchema.parse({ account: null }));
}
