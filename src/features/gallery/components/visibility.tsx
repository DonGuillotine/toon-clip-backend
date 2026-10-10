import { Globe, Lock, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { type Visibility } from "../schema";

/** Each visibility carries an icon and a word, never colour alone. */
export const VISIBILITY_META = {
  private: {
    label: "Private",
    icon: Lock,
    hint: "Only you can open it.",
  },
  public: {
    label: "Public",
    icon: Globe,
    hint: "Anyone with the link can watch it.",
  },
} satisfies Record<Visibility, { label: string; icon: LucideIcon; hint: string }>;

export function VisibilityBadge({
  visibility,
  overlay = false,
}: {
  readonly visibility: Visibility;
  readonly overlay?: boolean;
}) {
  const meta = VISIBILITY_META[visibility];
  const Icon = meta.icon;
  return (
    <Badge variant={overlay ? "overlay" : "default"}>
      <Icon aria-hidden="true" /> {meta.label}
    </Badge>
  );
}
