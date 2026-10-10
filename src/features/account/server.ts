import "server-only";

import { accountFixture } from "./mocks";
import { type Account, AccountSchema } from "./schema";

/**
 * The account, read on the server. Route handlers and server prefetches both
 * call this, so they can never disagree. When the backend lands, this is the
 * one function that changes.
 */
export function getAccount(): Account {
  return AccountSchema.parse(accountFixture);
}
