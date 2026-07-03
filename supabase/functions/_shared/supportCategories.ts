/**
 * Canonical weekly-goal / affirmation focus ids (DB, parsing) vs user-facing labels (UI, chat tone).
 * Keep in sync with `src/lib/affirmations-data.ts` SUPPORT_CATEGORIES.
 */
export const MANIFESTATION_FOCUS_CATEGORIES: readonly { canonical: string; label: string }[] = [
  { canonical: "Connections", label: "Love / SP" },
  { canonical: "Self-Love", label: "Beauty / Glow Up" },
  { canonical: "Confidence", label: "Self-Concept" },
  { canonical: "Finances", label: "Money" },
  { canonical: "Productivity", label: "Focus" },
  { canonical: "Organization", label: "Life Reset" },
  { canonical: "Fitness", label: "Body / Fitness" },
  { canonical: "Nutrition", label: "Wellness" },
  { canonical: "Discipline", label: "Discipline" },
  { canonical: "Career", label: "Career" },
  { canonical: "Business", label: "Business" },
  { canonical: "Learning", label: "School / Exams" },
] as const;

export const CANONICAL_MANIFESTATION_FOCUS_IDS = MANIFESTATION_FOCUS_CATEGORIES.map((r) => r.canonical);

function compactKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function displayLabelForCanonical(canonical: string | null | undefined): string {
  if (!canonical) return "";
  const row = MANIFESTATION_FOCUS_CATEGORIES.find((r) => r.canonical === canonical);
  return row?.label ?? canonical;
}

/** For model context: readable label plus stable id used in storage. */
export function formatCanonicalForPrompt(canonical: string): string {
  if (!canonical || canonical === "Uncategorized") return canonical;
  const label = displayLabelForCanonical(canonical);
  return label === canonical ? canonical : `${label} [${canonical}]`;
}

/**
 * Map a fragment from the assistant's confirmation ("under …") to a canonical id.
 * Accepts either canonical names or UI labels (spacing / punctuation tolerant).
 */
export function resolveWeeklyGoalCategoryFromAiText(fragment: string): string | null {
  const t = fragment.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  const key = compactKey(t);
  for (const row of MANIFESTATION_FOCUS_CATEGORIES) {
    if (row.canonical.toLowerCase() === lower) return row.canonical;
    if (row.label.toLowerCase() === lower) return row.canonical;
    if (compactKey(row.canonical) === key) return row.canonical;
    if (compactKey(row.label) === key) return row.canonical;
  }
  return null;
}

export const MANIFESTATION_FOCUS_CATEGORY_PROMPT = `
MANIFESTATION FOCUS AREAS (12) — user-facing label, then canonical id in brackets:
• Love / SP [Connections]
• Beauty / Glow Up [Self-Love]
• Self-Concept [Confidence]
• Money [Finances]
• Focus [Productivity]
• Life Reset [Organization]
• Body / Fitness [Fitness]
• Wellness [Nutrition]
• Discipline [Discipline]
• Career [Career]
• Business [Business]
• School / Exams [Learning]
`.trim();
