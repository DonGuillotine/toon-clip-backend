import { accountFixture } from "@/features/account/mocks";
import { AccountSchema } from "@/features/account/schema";

export function GET(): Response {
  return Response.json(AccountSchema.parse(accountFixture));
}
