/**
 * Mirrors `src/lib/conditionalSpecificityStorage.ts` — keep behavior in sync when changing either file.
 * Normalizes conditional step JSON for DB / onboarding_answers (schema_version, known keys only).
 */

const SP_CHOICES = new Set(["yes", "no", "complicated", "prefer_not"]);

function trimOrNull(s: string | undefined | null, max: number): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.slice(0, max);
}

export function normalizeConditionalSpecificity(
  raw: unknown,
  desireCategoryFallback: string | null,
): Record<string, unknown> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const rec = raw as Record<string, unknown>;
  const cat =
    (typeof rec.category === "string" && rec.category.trim()) ||
    (typeof desireCategoryFallback === "string" ? desireCategoryFallback.trim() : "");
  if (!cat) return {};

  const spRaw = rec.sp;
  if (spRaw && typeof spRaw === "object" && !Array.isArray(spRaw)) {
    const sp = spRaw as Record<string, unknown>;
    const hp = sp.hasSpecificPerson;
    if (typeof hp === "string" && SP_CHOICES.has(hp)) {
      const label =
        sp.label === null ? null : typeof sp.label === "string" ? trimOrNull(sp.label, 200) : null;
      return {
        schema_version: 1,
        category: cat,
        branch: "sp_person",
        sp: { hasSpecificPerson: hp, label },
      };
    }
  }

  const s7Raw = rec.step7;
  if (s7Raw && typeof s7Raw === "object" && !Array.isArray(s7Raw)) {
    const s7 = s7Raw as Record<string, unknown>;
    const selection = typeof s7.selection === "string" ? s7.selection.trim().slice(0, 500) : "";
    const custom =
      typeof s7.customText === "string"
        ? trimOrNull(s7.customText, 2000)
        : s7.customText === null
          ? null
          : null;
    if (selection.length > 0) {
      return {
        schema_version: 1,
        category: cat,
        branch: "step7_options",
        step7: { selection, customText: custom },
      };
    }
  }

  return {
    schema_version: 1,
    category: cat,
    branch: "step7_options",
  };
}
