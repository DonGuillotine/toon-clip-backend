import { DeskLibrarySchema, type DeskLibrary } from "./schema";

export const deskLibraryFixture: DeskLibrary = DeskLibrarySchema.parse({
  palettes: [
    {
      id: "pl_torch",
      name: "Torch and cobalt",
      swatches: [
        { hex: "#d83a2e", role: "Headband" },
        { hex: "#f4c430", role: "Vest" },
        { hex: "#1f3a8a", role: "Shadow" },
        { hex: "#1b1b1f", role: "Line" },
      ],
    },
    {
      id: "pl_adire",
      name: "Adire indigo",
      swatches: [
        { hex: "#27408b", role: "Deep dye" },
        { hex: "#4f6bb8", role: "Mid dye" },
        { hex: "#c9d4f0", role: "Resist" },
        { hex: "#f2ebe0", role: "Cloth" },
      ],
    },
    {
      id: "pl_harmattan",
      name: "Harmattan haze",
      swatches: [
        { hex: "#e0a526", role: "Sun" },
        { hex: "#c97b3d", role: "Dust" },
        { hex: "#8a5a3c", role: "Earth" },
        { hex: "#efe2c8", role: "Sky" },
      ],
    },
    {
      id: "pl_lagos",
      name: "Lagos night",
      swatches: [
        { hex: "#ef7d22", role: "Street light" },
        { hex: "#1f7a4d", role: "Signage" },
        { hex: "#2b2b2b", role: "Night" },
        { hex: "#e9e4da", role: "Highlight" },
      ],
    },
  ],
  styles: [
    {
      id: "st_anime",
      name: "2D anime",
      description: "Clean line art, cel shading, bold motion.",
      art: "burst",
      recipeId: "rc_anime_action",
      isDefault: true,
    },
    {
      id: "st_mafiki",
      name: "Mafiki",
      description: "Toon Central's house look: African pattern with comic line.",
      art: "rush",
      recipeId: "rc_mafiki",
      isDefault: false,
    },
    {
      id: "st_manga",
      name: "Manga ink",
      description: "Black ink, screentone, high contrast.",
      art: "rain",
      recipeId: "rc_manga_ink",
      isDefault: false,
    },
    {
      id: "st_paint",
      name: "Painterly",
      description: "Soft brushwork and warm light.",
      art: "dusk",
      recipeId: null,
      isDefault: false,
    },
  ],
  recipes: [
    { id: "rc_anime_action", name: "Anime action beats", version: 3 },
    { id: "rc_mafiki", name: "Mafiki pattern and line", version: 2 },
    { id: "rc_manga_ink", name: "Manga ink and tone", version: 1 },
    { id: "rc_golden_hour", name: "Golden hour lighting", version: 4 },
  ],
});
