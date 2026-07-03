/**
 * Canonical storage shape for Step 7 (conditional specificity) in setup draft + DB JSON.
 * Keeps keys stable for `onboarding_sessions.onboarding_answers` (e.g. `setup_path_v1.conditional_specificity`,
 * `setup_journey_v1.conditional_specificity`) and optional typed setup tables if deployed.
 */

export const CONDITIONAL_SPECIFICITY_SCHEMA_VERSION = 1 as const;

export type SpPersonChoice = "yes" | "no" | "complicated" | "prefer_not";

export type ConditionalBranch = "sp_person" | "step7_options";

export type ConditionalSpecificityV1 = {
  schema_version: typeof CONDITIONAL_SPECIFICITY_SCHEMA_VERSION;
  /** Canonical `SUPPORT_CATEGORIES[].name` */
  category: string;
  branch: ConditionalBranch;
  sp?: {
    hasSpecificPerson: SpPersonChoice;
    label: string | null;
  };
  step7?: {
    selection: string;
    customText: string | null;
  };
};

const SP_CHOICES = new Set<string>(["yes", "no", "complicated", "prefer_not"]);

function trimOrNull(s: string | undefined | null, max: number): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.slice(0, max);
}

/**
 * Builds a clean payload when saving from the conditional step (no spread from prior arbitrary JSON).
 */
export function buildConditionalSpecificityPayload(input: {
  category: string;
  isSpPersonBranch: boolean;
  sp?: { choice: string | null; name: string } | null;
  step7?: { selection: string | null; customText: string } | null;
}): ConditionalSpecificityV1 {
  const category = input.category.trim();
  if (input.isSpPersonBranch && input.sp?.choice && SP_CHOICES.has(input.sp.choice)) {
    return {
      schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
      category,
      branch: "sp_person",
      sp: {
        hasSpecificPerson: input.sp.choice as SpPersonChoice,
        label: trimOrNull(input.sp.name, 200),
      },
    };
  }
  const sel = input.step7?.selection?.trim() ?? "";
  if (sel.length > 0) {
    return {
      schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
      category,
      branch: "step7_options",
      step7: {
        selection: sel.slice(0, 500),
        customText: trimOrNull(input.step7?.customText ?? null, 2000),
      },
    };
  }
  return {
    schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
    category,
    branch: "step7_options",
  };
}

/**
 * Normalizes loose draft JSON into the V1 shape (drops unknown keys).
 */
export function normalizeConditionalSpecificityFromUnknown(
  raw: unknown,
  desireCategoryFallback: string | undefined,
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
      const v1: ConditionalSpecificityV1 = {
        schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
        category: cat,
        branch: "sp_person",
        sp: { hasSpecificPerson: hp as SpPersonChoice, label },
      };
      return { ...v1 };
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
      const v1: ConditionalSpecificityV1 = {
        schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
        category: cat,
        branch: "step7_options",
        step7: { selection, customText: custom },
      };
      return { ...v1 };
    }
  }

  return {
    schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
    category: cat,
    branch: "step7_options",
  };
}
