import { DeskLibrarySchema, type DeskLibrary } from "./schema";

export const deskLibraryFixture: DeskLibrary = DeskLibrarySchema.parse({
  palettes: [
    {
      id: "pl_torch",
      name: "Torch and cobalt",
      colours: ["#d83a2e", "#f4c430", "#1f3a8a", "#1b1b1f"],
    },
    { id: "pl_adire", name: "Adire indigo", colours: ["#27408b", "#4f6bb8", "#c9d4f0", "#f2ebe0"] },
    {
      id: "pl_harmattan",
      name: "Harmattan haze",
      colours: ["#e0a526", "#c97b3d", "#8a5a3c", "#efe2c8"],
    },
    { id: "pl_lagos", name: "Lagos night", colours: ["#ef7d22", "#1f7a4d", "#2b2b2b", "#e9e4da"] },
  ],
  styles: [
    {
      id: "st_anime",
      name: "2D anime",
      description: "Clean line art, cel shading, bold motion.",
      art: "burst",
      isDefault: true,
    },
    {
      id: "st_mafiki",
      name: "Mafiki",
      description: "Toon Central's house look: African pattern with comic line.",
      art: "rush",
      isDefault: false,
    },
    {
      id: "st_manga",
      name: "Manga ink",
      description: "Black ink, screentone, high contrast.",
      art: "rain",
      isDefault: false,
    },
    {
      id: "st_paint",
      name: "Painterly",
      description: "Soft brushwork and warm light.",
      art: "dusk",
      isDefault: false,
    },
  ],
});
