import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Briefcase,
  Droplet,
  Eye,
  Heart,
  Link2,
  Moon,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { GiSoap } from "react-icons/gi";

/** Stored in `user_daily_progress.completed_actions` as these slug keys. */
export type EmbodyPracticeKey =
  | "clean"
  | "drink-water"
  | "exercise"
  | "self-care"
  | "rest"
  | "have-fun"
  | "glam-up"
  | "connect"
  | "seen"
  | "work";

export type EmbodyPracticeDefinition = {
  key: EmbodyPracticeKey;
  /** Button / dashboard label (matches onboarding → app mapping). */
  shortLabel: string;
  /** Filename stem under `/videos/{characterFolder}/{videoFileName}.mp4` */
  videoFileName: string;
  Icon: LucideIcon | typeof GiSoap;
  /** Hex for heatmap / legend swatches */
  heatmapHex: string;
  /** Rotated column header in Activity Tracking */
  trackingLines: readonly string[];
};

/**
 * Canonical display order — matches onboarding “Embody daily identity” cards (1→10).
 * Onboarding draft keys map via `ONBOARDING_EMBODY_KEY_TO_APP`.
 */
export const ALL_EMBODY_PRACTICE_KEYS: readonly EmbodyPracticeKey[] = [
  "rest",
  "self-care",
  "clean",
  "drink-water",
  "have-fun",
  "exercise",
  "glam-up",
  "connect",
  "seen",
  "work",
] as const;

const KEY_SET = new Set<string>(ALL_EMBODY_PRACTICE_KEYS);

export const EMBODY_PRACTICES_BY_KEY: Record<EmbodyPracticeKey, EmbodyPracticeDefinition> = {
  rest: {
    key: "rest",
    shortLabel: "Rest",
    videoFileName: "Rest",
    Icon: Moon,
    heatmapHex: "#F59E0B",
    trackingLines: ["Rest"],
  },
  "self-care": {
    key: "self-care",
    shortLabel: "Care",
    videoFileName: "Self-Care",
    Icon: Heart,
    heatmapHex: "#EF4444",
    trackingLines: ["Care"],
  },
  clean: {
    key: "clean",
    shortLabel: "Clean",
    videoFileName: "Clean",
    Icon: GiSoap,
    heatmapHex: "#A855F7",
    trackingLines: ["Clean"],
  },
  "drink-water": {
    key: "drink-water",
    shortLabel: "Water",
    videoFileName: "Drink Water",
    Icon: Droplet,
    heatmapHex: "#3B82F6",
    trackingLines: ["Water"],
  },
  "have-fun": {
    key: "have-fun",
    shortLabel: "Fun",
    videoFileName: "Fun",
    Icon: PartyPopper,
    heatmapHex: "#EC4899",
    trackingLines: ["Fun"],
  },
  exercise: {
    key: "exercise",
    shortLabel: "Move",
    videoFileName: "Exercise",
    Icon: Activity,
    heatmapHex: "#10B981",
    trackingLines: ["Move"],
  },
  "glam-up": {
    key: "glam-up",
    shortLabel: "Glam Up",
    videoFileName: "Glam Up",
    Icon: Sparkles,
    heatmapHex: "#D946EF",
    trackingLines: ["Glam Up"],
  },
  connect: {
    key: "connect",
    shortLabel: "Connect",
    videoFileName: "Connect",
    Icon: Link2,
    heatmapHex: "#14B8A6",
    trackingLines: ["Connect"],
  },
  seen: {
    key: "seen",
    shortLabel: "Seen",
    videoFileName: "Seen",
    Icon: Eye,
    heatmapHex: "#6366F1",
    trackingLines: ["Seen"],
  },
  work: {
    key: "work",
    shortLabel: "Work",
    videoFileName: "Work",
    Icon: Briefcase,
    heatmapHex: "#78716C",
    trackingLines: ["Work"],
  },
};

/** Onboarding `EmbodyDailyIdentity` card keys → slug keys above (same order as onboarding OPTIONS). */
export const EMBODY_PRACTICE_SHORT_I18N_KEY: Record<EmbodyPracticeKey, string> = {
  rest: "double.choose.practicesShort.rest",
  "self-care": "double.choose.practicesShort.selfCare",
  clean: "double.choose.practicesShort.clean",
  "drink-water": "double.choose.practicesShort.drinkWater",
  "have-fun": "double.choose.practicesShort.haveFun",
  exercise: "double.choose.practicesShort.exercise",
  "glam-up": "double.choose.practicesShort.glamUp",
  connect: "double.choose.practicesShort.connect",
  seen: "double.choose.practicesShort.seen",
  work: "double.choose.practicesShort.work",
};

export const EMBODY_PRACTICE_CONFIRM_I18N_KEY: Record<EmbodyPracticeKey, string> = {
  rest: "double.embody.confirmQuestions.rest",
  "self-care": "double.embody.confirmQuestions.selfCare",
  clean: "double.embody.confirmQuestions.clean",
  "drink-water": "double.embody.confirmQuestions.drinkWater",
  "have-fun": "double.embody.confirmQuestions.haveFun",
  exercise: "double.embody.confirmQuestions.exercise",
  "glam-up": "double.embody.confirmQuestions.glamUp",
  connect: "double.embody.confirmQuestions.connect",
  seen: "double.embody.confirmQuestions.seen",
  work: "double.embody.confirmQuestions.work",
};

export const ONBOARDING_EMBODY_KEY_TO_APP: Record<string, EmbodyPracticeKey> = {
  embody_rest: "rest",
  embody_self_care: "self-care",
  embody_clean_environment: "clean",
  embody_nutrition: "drink-water",
  embody_have_fun: "have-fun",
  embody_move: "exercise",
  embody_glam_up: "glam-up",
  embody_connect: "connect",
  embody_seen: "seen",
  embody_work_or_study: "work",
};

export function getEmbodyPractice(key: EmbodyPracticeKey): EmbodyPracticeDefinition {
  return EMBODY_PRACTICES_BY_KEY[key];
}

export function isEmbodyPracticeKey(k: string): k is EmbodyPracticeKey {
  return KEY_SET.has(k);
}

/**
 * Map onboarding card keys (`embody_rest`, …) from setup draft → app slugs stored in
 * `user_preferences.embody_active_practices`. Returns null unless exactly five valid distinct slugs.
 */
export function mapOnboardingEmbodyKeysToAppSlugs(onboardingKeys: unknown): EmbodyPracticeKey[] | null {
  if (!Array.isArray(onboardingKeys) || onboardingKeys.length !== 5) return null;
  const mapped = (onboardingKeys as unknown[])
    .filter((x): x is string => typeof x === "string")
    .map((k) => ONBOARDING_EMBODY_KEY_TO_APP[k])
    .filter((k): k is EmbodyPracticeKey => typeof k === "string" && isEmbodyPracticeKey(k));
  const uniq: EmbodyPracticeKey[] = [];
  for (const k of mapped) {
    if (!uniq.includes(k)) uniq.push(k);
  }
  return uniq.length === 5 ? uniq : null;
}
