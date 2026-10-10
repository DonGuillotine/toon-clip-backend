import { type RecipeScope } from "./schema";

/** How each recipe scope reads in the profile. */
export const SCOPE_LABELS = {
  camera: "Camera",
  lighting: "Lighting",
  character: "Character",
  action: "Action",
  style: "Style",
} satisfies Record<RecipeScope, string>;
