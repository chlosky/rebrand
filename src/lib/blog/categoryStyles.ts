import type { BlogPost } from "./types";

/** Display order for filter chips (subset may appear depending on posts). */
export const BLOG_CATEGORY_ORDER: string[] = [
  "Subliminals",
  "Mirror Work",
  "Self Concept",
  "Law of Assumption",
  "Just Deciding",
  "Manifesting an SP",
  "Integrated Manifestation Tools",
];

/**
 * Accent hex per category — aligned with onboarding bubble colors (#4AC7FF, #8fbf76, …) plus distinct hues for each subject.
 */
export const BLOG_CATEGORY_ACCENTS: Record<string, string> = {
  Subliminals: "#4AC7FF",
  "Mirror Work": "#FFB6C1",
  "Self Concept": "#8fbf76",
  "Law of Assumption": "#6366F1",
  "Just Deciding": "#FFC107",
  "Manifesting an SP": "#C084FC",
  "Integrated Manifestation Tools": "#2DD4BF",
};

export function getCategoryAccent(category: string): string {
  return BLOG_CATEGORY_ACCENTS[category] ?? "#737373";
}

export function getCategoriesPresentInPosts(posts: BlogPost[]): string[] {
  const present = new Set(posts.map((p) => p.category));
  const ordered = BLOG_CATEGORY_ORDER.filter((c) => present.has(c));
  const extras = [...present]
    .filter((c) => !BLOG_CATEGORY_ORDER.includes(c))
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...extras];
}
