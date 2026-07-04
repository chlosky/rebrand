/**
 * Canonical storage shape for the focus-details setup step (setup draft + DB JSON).
 * Wire keys stay stable for `onboarding_sessions.onboarding_answers`
 * (`setup_path_v1.conditional_specificity`, `setup_journey_v1.conditional_specificity`)
 * and must match `supabase/functions/_shared/conditionalSpecificityNormalize.ts`.
 */

export const FOCUS_DETAIL_SCHEMA_VERSION = 1 as const;

export type FocusDetailBranch = "sp_person" | "step7_options";

export type FocusDetailV1 = {
  schema_version: typeof FOCUS_DETAIL_SCHEMA_VERSION;
  /** Canonical `FOCUS_CATEGORIES[].name` */
  category: string;
  branch: FocusDetailBranch;
  step7?: {
    selection: string;
    customText: string | null;
  };
};

function trimOrNull(s: string | undefined | null, max: number): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.slice(0, max);
}

/** Builds a clean payload when saving from the focus-details step. */
export function buildFocusDetailPayload(input: {
  category: string;
  selection: string | null;
  customText: string;
}): FocusDetailV1 {
  const category = input.category.trim();
  const sel = input.selection?.trim() ?? "";
  if (sel.length > 0) {
    return {
      schema_version: FOCUS_DETAIL_SCHEMA_VERSION,
      category,
      branch: "step7_options",
      step7: {
        selection: sel.slice(0, 500),
        customText: trimOrNull(input.customText, 2000),
      },
    };
  }
  return {
    schema_version: FOCUS_DETAIL_SCHEMA_VERSION,
    category,
    branch: "step7_options",
  };
}

/** Normalizes loose draft JSON into the V1 shape (drops unknown keys). */
export function normalizeFocusDetailFromUnknown(
  raw: unknown,
  categoryFallback: string | undefined,
): Record<string, unknown> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const rec = raw as Record<string, unknown>;
  const cat =
    (typeof rec.category === "string" && rec.category.trim()) ||
    (typeof categoryFallback === "string" ? categoryFallback.trim() : "");
  if (!cat) return {};

  const s7Raw = rec.step7;
  if (s7Raw && typeof s7Raw === "object" && !Array.isArray(s7Raw)) {
    const s7 = s7Raw as Record<string, unknown>;
    const selection = typeof s7.selection === "string" ? s7.selection.trim().slice(0, 500) : "";
    const custom = typeof s7.customText === "string" ? trimOrNull(s7.customText, 2000) : null;
    if (selection.length > 0) {
      const v1: FocusDetailV1 = {
        schema_version: FOCUS_DETAIL_SCHEMA_VERSION,
        category: cat,
        branch: "step7_options",
        step7: { selection, customText: custom },
      };
      return { ...v1 };
    }
  }

  return {
    schema_version: FOCUS_DETAIL_SCHEMA_VERSION,
    category: cat,
    branch: "step7_options",
  };
}
