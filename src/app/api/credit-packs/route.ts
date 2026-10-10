import { CreditPacksSchema } from "@/features/account/schema";
import { getCreditPacks } from "@/features/account/server";

export function GET(): Response {
  return Response.json(CreditPacksSchema.parse(getCreditPacks()));
}
