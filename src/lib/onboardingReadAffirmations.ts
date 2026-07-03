import i18n from "@/i18n";
import type { SetupDraft } from "@/lib/setupDraft";
import { SUPPORT_CATEGORIES, getSupportCategoryLabel } from "@/lib/affirmations-data";

const CANONICAL = new Set(SUPPORT_CATEGORIES.map((c) => c.name));

function getOnboardingReadAffirmationLines(category: string): readonly string[] {
  const raw = i18n.t(`setup.readAffirmations.${category}`, {
    ns: "onboarding",
    returnObjects: true,
  });
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    return raw;
  }
  return [];
}

/** Single manifest focus: primary `desireCategory`, else first valid `desireCategories` entry (legacy). */
export function resolveOnboardingManifestCategories(draft: SetupDraft): string[] {
  const primary = typeof draft.desireCategory === "string" ? draft.desireCategory.trim() : "";
  if (primary && CANONICAL.has(primary)) return [primary];

  if (Array.isArray(draft.desireCategories) && draft.desireCategories.length > 0) {
    for (const x of draft.desireCategories) {
      if (typeof x === "string" && CANONICAL.has(x)) return [x];
    }
  }
  return [];
}

/** Full read-aloud string for the onboarding affirmation step. */
export function buildOnboardingAffirmationReadText(categories: string[]): string {
  const withCopy = categories.filter((c) => getOnboardingReadAffirmationLines(c).length > 0);
  if (withCopy.length === 0) return "";
  if (withCopy.length === 1) {
    const cat = withCopy[0]!;
    return getOnboardingReadAffirmationLines(cat).join("\n\n");
  }
  return withCopy
    .map((cat) => {
      const lines = getOnboardingReadAffirmationLines(cat);
      return `${getSupportCategoryLabel(cat)}\n\n${lines.join("\n\n")}`;
    })
    .join("\n\n");
}

/** ~Natural silent reading pace (characters per step for typewriter). */
export function msPerCharReadingPace(text: string, wordsPerMinute = 220): number {
  const t = text.trim();
  if (t.length === 0) return 32;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  const durationMs = (words / wordsPerMinute) * 60 * 1000;
  return Math.min(72, Math.max(22, Math.round(durationMs / t.length)));
}
