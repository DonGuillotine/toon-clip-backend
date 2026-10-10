import { completeTour } from "@/features/account/server";

/** Finishing or skipping the tour marks it complete. */
export function POST(): Response {
  return Response.json(completeTour());
}
