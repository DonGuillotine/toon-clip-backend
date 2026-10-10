import { AccountSchema, type Account } from "./schema";

export const accountFixture: Account = AccountSchema.parse({
  id: "usr_satyam",
  displayName: "Satyam",
  handle: "satyam",
  credits: 1240,
  hasCompletedTour: true,
});
