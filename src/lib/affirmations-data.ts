import i18n from "@/i18n";

/** Max characters per affirmation line in Affirm & Script */
export const AFFIRMATION_LINE_MAX_LENGTH = 150;

/** Max characters for custom set name */
export const AFFIRMATION_SET_NAME_MAX_LENGTH = 50;

export interface AffirmationSet {
  id: string;
  name: string;
  affirmations: string[];
  images?: Array<{ id: string; url: string; prompt?: string }>;
  isPremade?: boolean;
  category?: string;
}

export type SupportCategoryCharacter = "river" | "sage" | "rose" | "oliver";

/** `name` is the canonical value (DB, AI, onboarding storage); `label` is user-facing. */
export interface SupportCategoryDef {
  name: string;
  label: string;
  color: string;
  character: SupportCategoryCharacter;
}

// Support categories matching onboarding (12 total). Order = 2-col grid on manifest setup
// (Love/SP, Beauty/Glow Up, Self-Concept, Money, remaining sage, yellow cluster, blue).
// Keep labels in sync with `supabase/functions/_shared/supportCategories.ts`.
export const SUPPORT_CATEGORIES: SupportCategoryDef[] = [
  { name: "Connections", label: "Love / SP", color: "#FFB6C1", character: "rose" },
  { name: "Self-Love", label: "Beauty / Glow Up", color: "#FFB6C1", character: "rose" },
  { name: "Confidence", label: "Self-Concept", color: "#FFB6C1", character: "rose" },
  { name: "Finances", label: "Money", color: "#8fbf76", character: "sage" },
  { name: "Productivity", label: "Focus", color: "#8fbf76", character: "sage" },
  { name: "Organization", label: "Life Reset", color: "#8fbf76", character: "sage" },
  { name: "Fitness", label: "Body / Fitness", color: "#FFC107", character: "oliver" },
  { name: "Nutrition", label: "Wellness", color: "#FFC107", character: "oliver" },
  { name: "Discipline", label: "Discipline", color: "#FFC107", character: "oliver" },
  { name: "Career", label: "Career", color: "#4AC7FF", character: "river" },
  { name: "Business", label: "Business", color: "#4AC7FF", character: "river" },
  { name: "Learning", label: "School / Exams", color: "#4AC7FF", character: "river" },
];

export function getSupportCategoryLabel(category: string | null | undefined): string {
  if (category == null || category === "") return "";
  const key = `supportCategories.${category}`;
  if (i18n.exists(key, { ns: "tools" })) {
    return i18n.t(key, { ns: "tools" });
  }
  const row = SUPPORT_CATEGORIES.find((c) => c.name === category);
  return row?.label ?? category;
}

// Premade affirmation sets
export const PREMADE_SETS: AffirmationSet[] = [
  {
    id: "wealth",
    name: "Wealth & Abundance",
    isPremade: true,
    category: "Finances",
    affirmations: [
      "I am a money magnet and attract wealth effortlessly",
      "Abundance flows to me from multiple sources",
      "I am worthy of financial prosperity and success",
      "Money comes to me easily and frequently",
      "I am financially free and secure",
      "I create wealth through my talents and abilities",
      "My income exceeds my expenses consistently",
      "I make smart financial decisions with confidence",
    ],
  },
  {
    id: "love",
    name: "Love & Relationships",
    isPremade: true,
    category: "Connections",
    affirmations: [
      "I am worthy of deep, authentic love",
      "I attract healthy and fulfilling relationships",
      "Love flows freely to and from me",
      "I communicate my needs with kindness and clarity",
      "I am surrounded by supportive, loving people",
      "My heart is open to give and receive love",
      "I deserve respect and kindness in all relationships",
      "I cultivate genuine connections every day",
    ],
  },
  {
    id: "confidence",
    name: "Confidence & Self-Worth",
    isPremade: true,
    category: "Confidence",
    affirmations: [
      "I trust myself to make good decisions",
      "I am confident and capable in all that I do",
      "I embrace challenges as opportunities to grow",
      "My self-worth is inherent and unshakeable",
      "I speak with confidence and clarity",
      "I believe in my abilities and talents",
      "I am proud of who I am becoming",
      "I show up as my authentic self every day",
    ],
  },
  {
    id: "health",
    name: "Health & Wellness",
    isPremade: true,
    category: "Fitness",
    affirmations: [
      "I honor my body with nourishing choices",
      "I am energetic, strong, and vibrant",
      "Every day I become healthier and fitter",
      "I prioritize rest and recovery",
      "My mind and body are in harmony",
      "I listen to my body and give it what it needs",
      "I enjoy moving my body regularly",
      "I am grateful for my health and vitality",
    ],
  },
  {
    id: "career",
    name: "Career & Success",
    isPremade: true,
    category: "Career",
    affirmations: [
      "I excel in my chosen career path",
      "Opportunities for growth come to me easily",
      "I am valued and respected in my work",
      "I achieve my goals with focus and determination",
      "I am a problem-solver and innovator",
      "Success flows from my consistent actions",
      "I lead with confidence and integrity",
      "I create meaningful impact through my work",
    ],
  },
  {
    id: "spiritual",
    name: "Spiritual Growth",
    isPremade: true,
    category: "Self-Love",
    affirmations: [
      "I am connected to my higher purpose",
      "I trust the guidance of my intuition",
      "I am aligned with peace and clarity",
      "I release what no longer serves me",
      "I welcome growth and transformation",
      "My spirit is grounded and expansive",
      "I am open to wisdom and insight",
      "I radiate love and compassion",
    ],
  },
  {
    id: "productivity",
    name: "Productivity & Focus",
    isPremade: true,
    category: "Productivity",
    affirmations: [
      "I focus on what matters most each day",
      "I plan my work and work my plan",
      "I make steady progress toward my goals",
      "I minimize distractions and stay present",
      "I am disciplined and consistent",
      "I use my time wisely and intentionally",
      "I finish what I start",
      "I celebrate small wins along the way",
    ],
  },
  {
    id: "learning",
    name: "Learning & Growth",
    isPremade: true,
    category: "Learning",
    affirmations: [
      "I learn quickly and effectively",
      "I enjoy mastering new skills",
      "I turn mistakes into lessons",
      "My curiosity drives my growth",
      "I retain information with ease",
      "I ask great questions and seek answers",
      "I am persistent and patient with learning",
      "Learning is enjoyable and rewarding for me",
    ],
  },
];

export function getLocalizedPremadeSets(): AffirmationSet[] {
  return PREMADE_SETS.map((set) => {
    const nameKey = `affirmations.premade.${set.id}.name`;
    const affKey = `affirmations.premade.${set.id}.affirmations`;
    const name = i18n.exists(nameKey, { ns: "tools" }) ? i18n.t(nameKey, { ns: "tools" }) : set.name;
    const localizedAffirmations = i18n.t(affKey, { ns: "tools", returnObjects: true });
    const affirmations = Array.isArray(localizedAffirmations) && localizedAffirmations.every((line) => typeof line === "string")
      ? (localizedAffirmations as string[])
      : set.affirmations;
    return { ...set, name, affirmations };
  });
}









