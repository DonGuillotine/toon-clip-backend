import "server-only";

import { modelsFixture } from "./mocks";
import { type Model, ModelsSchema } from "./schema";

/**
 * The model capability matrix, read on the server. The route handler and the
 * Quick create prefetch both call this. When the backend lands, this changes.
 */
export function getModels(): Model[] {
  return ModelsSchema.parse(modelsFixture);
}
