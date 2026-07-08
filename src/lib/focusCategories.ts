import i18n from "@/i18n";

/** `name` is the stored value (DB, AI, onboarding storage) and equals `label`. */
export interface FocusCategoryDef {
  name: string;
  label: string;
  color: string;
}

// Board focus categories (10 total). Order = 2-col grid on the setup focus screen.
// `name` === `label` — no separate internal taxonomy. Keep in sync with the board image library themes.
export const FOCUS_CATEGORIES: FocusCategoryDef[] = [
  { name: "Career & Money", label: "Career & Money", color: "#3CB371" },
  { name: "Love & Relationships", label: "Love & Relationships", color: "#FF4DA6" },
  { name: "Home & Space", label: "Home & Space", color: "#87CEEB" },
  { name: "Beauty & Wellness", label: "Beauty & Wellness", color: "#F8BBD0" },
  { name: "Travel & Adventure", label: "Travel & Adventure", color: "#FF8C42" },
  { name: "Organization & Plan", label: "Organization & Plan", color: "#2563EB" },
  { name: "Aesthetic & Mood", label: "Aesthetic & Mood", color: "#FFD93D" },
  { name: "College & School", label: "College & School", color: "#98FB98" },
  { name: "Health & Fitness", label: "Health & Fitness", color: "#E63946" },
  { name: "Self & Direction", label: "Self & Direction", color: "#E8B4B8" },
];

export function getFocusCategoryLabel(category: string | null | undefined): string {
  if (category == null || category === "") return "";
  const key = `focusCategories.${category}`;
  if (i18n.exists(key, { ns: "tools" })) {
    return i18n.t(key, { ns: "tools" });
  }
  const row = FOCUS_CATEGORIES.find((c) => c.name === category);
  return row?.label ?? category;
}
