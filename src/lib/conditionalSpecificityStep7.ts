/**
 * Step 7 (conditional specificity) copy and options by canonical manifestation focus id
 * (`desireCategory` / `SUPPORT_CATEGORIES[].name`). Labels in UI elsewhere; here we only
 * branch on canonical ids. Keep in sync with user-facing category table.
 */

export type SpPersonChoice = "yes" | "no" | "complicated" | "prefer_not";

export type Step7Option = {
  /** Persisted in `step7.selection` (English canonical) */
  value: string;
  labelKey: string;
};

export type Step7ChoiceConfig = {
  headlineKey: string;
  options: readonly Step7Option[];
};

const SP_HEADLINE_KEY = "setup.conditionalSpecificity.spPerson.headline";

const CHOICE: Record<string, Step7ChoiceConfig> = {
  Finances: {
    headlineKey: "setup.conditionalSpecificity.categories.Finances.headline",
    options: [
      { value: "Consistent income", labelKey: "setup.conditionalSpecificity.categories.Finances.options.consistentIncome" },
      { value: "Debt freedom", labelKey: "setup.conditionalSpecificity.categories.Finances.options.debtFreedom" },
      { value: "More sales", labelKey: "setup.conditionalSpecificity.categories.Finances.options.moreSales" },
      { value: "Luxury & ease", labelKey: "setup.conditionalSpecificity.categories.Finances.options.luxuryEase" },
      { value: "Financial safety", labelKey: "setup.conditionalSpecificity.categories.Finances.options.financialSafety" },
    ],
  },
  "Self-Love": {
    headlineKey: "setup.conditionalSpecificity.categories.Self-Love.headline",
    options: [
      { value: "Beautiful", labelKey: "setup.conditionalSpecificity.categories.Self-Love.options.beautiful" },
      { value: "Desired", labelKey: "setup.conditionalSpecificity.categories.Self-Love.options.desired" },
      { value: "Radiant", labelKey: "setup.conditionalSpecificity.categories.Self-Love.options.radiant" },
      { value: "Expensive", labelKey: "setup.conditionalSpecificity.categories.Self-Love.options.expensive" },
      { value: "Seen", labelKey: "setup.conditionalSpecificity.categories.Self-Love.options.seen" },
    ],
  },
  Career: {
    headlineKey: "setup.conditionalSpecificity.categories.Career.headline",
    options: [
      { value: "New job", labelKey: "setup.conditionalSpecificity.categories.Career.options.newJob" },
      { value: "Promotion", labelKey: "setup.conditionalSpecificity.categories.Career.options.promotion" },
      { value: "Higher pay", labelKey: "setup.conditionalSpecificity.categories.Career.options.higherPay" },
      { value: "Dream opportunity", labelKey: "setup.conditionalSpecificity.categories.Career.options.dreamOpportunity" },
    ],
  },
  Business: {
    headlineKey: "setup.conditionalSpecificity.categories.Business.headline",
    options: [
      { value: "More sales", labelKey: "setup.conditionalSpecificity.categories.Business.options.moreSales" },
      { value: "More customers/clients", labelKey: "setup.conditionalSpecificity.categories.Business.options.moreCustomersClients" },
      { value: "Launch success", labelKey: "setup.conditionalSpecificity.categories.Business.options.launchSuccess" },
      { value: "Audience growth", labelKey: "setup.conditionalSpecificity.categories.Business.options.audienceGrowth" },
    ],
  },
  Confidence: {
    headlineKey: "setup.conditionalSpecificity.categories.Confidence.headline",
    options: [
      { value: "Confidence", labelKey: "setup.conditionalSpecificity.categories.Confidence.options.confidence" },
      { value: "Visibility", labelKey: "setup.conditionalSpecificity.categories.Confidence.options.visibility" },
      { value: "Self-trust", labelKey: "setup.conditionalSpecificity.categories.Confidence.options.selfTrust" },
      { value: "Magnetism", labelKey: "setup.conditionalSpecificity.categories.Confidence.options.magnetism" },
    ],
  },
  Learning: {
    headlineKey: "setup.conditionalSpecificity.categories.Learning.headline",
    options: [
      { value: "Better grades", labelKey: "setup.conditionalSpecificity.categories.Learning.options.betterGrades" },
      { value: "Exam success", labelKey: "setup.conditionalSpecificity.categories.Learning.options.examSuccess" },
      { value: "College acceptance", labelKey: "setup.conditionalSpecificity.categories.Learning.options.collegeAcceptance" },
      { value: "Scholarship", labelKey: "setup.conditionalSpecificity.categories.Learning.options.scholarship" },
      { value: "Focus studying", labelKey: "setup.conditionalSpecificity.categories.Learning.options.focusStudying" },
    ],
  },
  Discipline: {
    headlineKey: "setup.conditionalSpecificity.categories.Discipline.headline",
    options: [
      { value: "Morning routine", labelKey: "setup.conditionalSpecificity.categories.Discipline.options.morningRoutine" },
      { value: "Fitness", labelKey: "setup.conditionalSpecificity.categories.Discipline.options.fitness" },
      { value: "Studying", labelKey: "setup.conditionalSpecificity.categories.Discipline.options.studying" },
      { value: "Work", labelKey: "setup.conditionalSpecificity.categories.Discipline.options.work" },
      { value: "Self-care", labelKey: "setup.conditionalSpecificity.categories.Discipline.options.selfCare" },
    ],
  },
  Productivity: {
    headlineKey: "setup.conditionalSpecificity.categories.Productivity.headline",
    options: [
      { value: "Work projects", labelKey: "setup.conditionalSpecificity.categories.Productivity.options.workProjects" },
      { value: "Studying", labelKey: "setup.conditionalSpecificity.categories.Productivity.options.studying" },
      { value: "Creative work", labelKey: "setup.conditionalSpecificity.categories.Productivity.options.creativeWork" },
      { value: "Content creation", labelKey: "setup.conditionalSpecificity.categories.Productivity.options.contentCreation" },
      { value: "Daily routine", labelKey: "setup.conditionalSpecificity.categories.Productivity.options.dailyRoutine" },
    ],
  },
  Fitness: {
    headlineKey: "setup.conditionalSpecificity.categories.Fitness.headline",
    options: [
      { value: "Strength", labelKey: "setup.conditionalSpecificity.categories.Fitness.options.strength" },
      { value: "Shape & tone", labelKey: "setup.conditionalSpecificity.categories.Fitness.options.shapeTone" },
      { value: "Energy", labelKey: "setup.conditionalSpecificity.categories.Fitness.options.energy" },
      { value: "Confidence", labelKey: "setup.conditionalSpecificity.categories.Fitness.options.confidence" },
      { value: "Consistent workouts", labelKey: "setup.conditionalSpecificity.categories.Fitness.options.consistentWorkouts" },
    ],
  },
  Nutrition: {
    headlineKey: "setup.conditionalSpecificity.categories.Nutrition.headline",
    options: [
      { value: "More energy", labelKey: "setup.conditionalSpecificity.categories.Nutrition.options.moreEnergy" },
      { value: "Better rest", labelKey: "setup.conditionalSpecificity.categories.Nutrition.options.betterRest" },
      { value: "Emotional ease", labelKey: "setup.conditionalSpecificity.categories.Nutrition.options.emotionalEase" },
      { value: "Balance", labelKey: "setup.conditionalSpecificity.categories.Nutrition.options.balance" },
      { value: "Softer routines", labelKey: "setup.conditionalSpecificity.categories.Nutrition.options.softerRoutines" },
    ],
  },
  Organization: {
    headlineKey: "setup.conditionalSpecificity.categories.Organization.headline",
    options: [
      { value: "My space", labelKey: "setup.conditionalSpecificity.categories.Organization.options.mySpace" },
      { value: "My schedule", labelKey: "setup.conditionalSpecificity.categories.Organization.options.mySchedule" },
      { value: "My routines", labelKey: "setup.conditionalSpecificity.categories.Organization.options.myRoutines" },
      { value: "My environment", labelKey: "setup.conditionalSpecificity.categories.Organization.options.myEnvironment" },
      { value: "My priorities", labelKey: "setup.conditionalSpecificity.categories.Organization.options.myPriorities" },
    ],
  },
};

export function isSpPersonStep7Category(canonical: string): boolean {
  const c = canonical.trim();
  return c === "Connections" || c === "sp_love";
}

/** i18n key under the `onboarding` namespace */
export function getSpPersonHeadline(): string {
  return SP_HEADLINE_KEY;
}

export function getStep7ChoiceConfig(canonical: string): Step7ChoiceConfig | null {
  const c = canonical.trim();
  if (isSpPersonStep7Category(c)) return null;
  return CHOICE[c] ?? null;
}

/** Self-Concept (Confidence) no longer has a specificity sub-step — skip the conditional page entirely. */
export function needsSetupConditionalSpecificityPage(canonical: string): boolean {
  const c = canonical.trim();
  if (!c) return false;
  if (isSpPersonStep7Category(c)) return true;
  return getStep7ChoiceConfig(c) != null;
}

export function normalizeDesireCategoryForStep7(raw: string | undefined): string {
  return (raw ?? "").trim();
}
