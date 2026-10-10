import { type Metadata } from "next";

import { CharacterEditor } from "@/features/characters/components/character-editor";

export const metadata: Metadata = { title: "New character" };

export default function NewCharacterPage() {
  return <CharacterEditor id={null} />;
}
