import { type CreateMode, QuoteSchema, type Quote, type QuoteRequest } from "./schema";

const perSecond = {
  storyboard: 4,
  video: 6,
  image: 0,
  audio: 1,
} satisfies Record<CreateMode, number>;

const flat = {
  storyboard: 0,
  video: 0,
  image: 8,
  audio: 4,
} satisfies Record<CreateMode, number>;

/** Stand-in pricing until the backend quotes for real. */
export function quoteFixture({ mode, lengthSec }: QuoteRequest): Quote {
  return QuoteSchema.parse({ credits: flat[mode] + perSecond[mode] * lengthSec });
}
