/**
 * Follow-up options for the focus-details step, keyed by focus category
 * (`FOCUS_CATEGORIES[].name`). Labels live in i18n; here we only branch on the id.
 */

export type FocusDetailOption = {
  /** Persisted in the focus-details payload (English) */
  value: string;
  labelKey: string;
};

export type FocusDetailOptionSet = {
  headlineKey: string;
  options: readonly FocusDetailOption[];
};

const CHOICE: Record<string, FocusDetailOptionSet> = {
  Identity: {
    headlineKey: "setup.focusDetails.categories.Identity.headline",
    options: [
      { value: "Confidence", labelKey: "setup.focusDetails.categories.Identity.options.confidence" },
      { value: "Discipline", labelKey: "setup.focusDetails.categories.Identity.options.discipline" },
      { value: "A new chapter", labelKey: "setup.focusDetails.categories.Identity.options.newChapter" },
      { value: "Self-trust", labelKey: "setup.focusDetails.categories.Identity.options.selfTrust" },
      { value: "Fresh start", labelKey: "setup.focusDetails.categories.Identity.options.freshStart" },
    ],
  },
  "Career & Money": {
    headlineKey: "setup.focusDetails.categories.Career & Money.headline",
    options: [
      { value: "New job", labelKey: "setup.focusDetails.categories.Career & Money.options.newJob" },
      { value: "Promotion", labelKey: "setup.focusDetails.categories.Career & Money.options.promotion" },
      { value: "Higher income", labelKey: "setup.focusDetails.categories.Career & Money.options.higherIncome" },
      { value: "Debt freedom", labelKey: "setup.focusDetails.categories.Career & Money.options.debtFreedom" },
      { value: "Start a business", labelKey: "setup.focusDetails.categories.Career & Money.options.startBusiness" },
    ],
  },
  "Love & Relationships": {
    headlineKey: "setup.focusDetails.categories.Love & Relationships.headline",
    options: [
      { value: "Dating", labelKey: "setup.focusDetails.categories.Love & Relationships.options.dating" },
      { value: "Deeper connection", labelKey: "setup.focusDetails.categories.Love & Relationships.options.deeperConnection" },
      { value: "Self-love", labelKey: "setup.focusDetails.categories.Love & Relationships.options.selfLove" },
      { value: "Better boundaries", labelKey: "setup.focusDetails.categories.Love & Relationships.options.betterBoundaries" },
      { value: "Quality time", labelKey: "setup.focusDetails.categories.Love & Relationships.options.quality" },
    ],
  },
  "Home & Space": {
    headlineKey: "setup.focusDetails.categories.Home & Space.headline",
    options: [
      { value: "Redecorate", labelKey: "setup.focusDetails.categories.Home & Space.options.redecorate" },
      { value: "Declutter & reset", labelKey: "setup.focusDetails.categories.Home & Space.options.declutter" },
      { value: "A new place", labelKey: "setup.focusDetails.categories.Home & Space.options.newPlace" },
      { value: "Cozy upgrade", labelKey: "setup.focusDetails.categories.Home & Space.options.cozyUpgrade" },
      { value: "Organized systems", labelKey: "setup.focusDetails.categories.Home & Space.options.systems" },
    ],
  },
  "Beauty & Wellness": {
    headlineKey: "setup.focusDetails.categories.Beauty & Wellness.headline",
    options: [
      { value: "Skin & beauty", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.skinBeauty" },
      { value: "Self-care routine", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.selfCare" },
      { value: "Better rest", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.betterRest" },
      { value: "Confidence", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.confidence" },
      { value: "Overall wellness", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.overallWellness" },
    ],
  },
  "Travel & Adventure": {
    headlineKey: "setup.focusDetails.categories.Travel & Adventure.headline",
    options: [
      { value: "Dream trip", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.dreamTrip" },
      { value: "Move abroad", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.moveAbroad" },
      { value: "Weekend escapes", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.weekendEscapes" },
      { value: "Bucket list", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.bucketList" },
      { value: "Digital nomad life", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.nomadLife" },
    ],
  },
  "Organization & Plan": {
    headlineKey: "setup.focusDetails.categories.Organization & Plan.headline",
    options: [
      { value: "My schedule", labelKey: "setup.focusDetails.categories.Organization & Plan.options.mySchedule" },
      { value: "My space", labelKey: "setup.focusDetails.categories.Organization & Plan.options.mySpace" },
      { value: "My routines", labelKey: "setup.focusDetails.categories.Organization & Plan.options.myRoutines" },
      { value: "My priorities", labelKey: "setup.focusDetails.categories.Organization & Plan.options.myPriorities" },
      { value: "My whole life", labelKey: "setup.focusDetails.categories.Organization & Plan.options.myWholeLife" },
    ],
  },
  "Aesthetic & Mood": {
    headlineKey: "setup.focusDetails.categories.Aesthetic & Mood.headline",
    options: [
      { value: "Personal style", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.personalStyle" },
      { value: "Interiors", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.interiors" },
      { value: "Color palette", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.colorPalette" },
      { value: "Creative direction", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.creativeDirection" },
      { value: "Overall aesthetic", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.overallAesthetic" },
    ],
  },
  "College & School": {
    headlineKey: "setup.focusDetails.categories.College & School.headline",
    options: [
      { value: "Better grades", labelKey: "setup.focusDetails.categories.College & School.options.betterGrades" },
      { value: "Exam success", labelKey: "setup.focusDetails.categories.College & School.options.examSuccess" },
      { value: "College acceptance", labelKey: "setup.focusDetails.categories.College & School.options.collegeAcceptance" },
      { value: "Scholarship", labelKey: "setup.focusDetails.categories.College & School.options.scholarship" },
      { value: "Focus & study habits", labelKey: "setup.focusDetails.categories.College & School.options.studyHabits" },
    ],
  },
  "Health & Fitness": {
    headlineKey: "setup.focusDetails.categories.Health & Fitness.headline",
    options: [
      { value: "Strength", labelKey: "setup.focusDetails.categories.Health & Fitness.options.strength" },
      { value: "Shape & tone", labelKey: "setup.focusDetails.categories.Health & Fitness.options.shapeTone" },
      { value: "Energy", labelKey: "setup.focusDetails.categories.Health & Fitness.options.energy" },
      { value: "Consistent workouts", labelKey: "setup.focusDetails.categories.Health & Fitness.options.consistentWorkouts" },
      { value: "Nutrition", labelKey: "setup.focusDetails.categories.Health & Fitness.options.nutrition" },
    ],
  },
};

export function getFocusDetailOptions(category: string): FocusDetailOptionSet | null {
  return CHOICE[category.trim()] ?? null;
}

/** A category shows the focus-details step only when it has a defined option set. */
export function needsFocusDetailsStep(category: string): boolean {
  const c = category.trim();
  if (!c) return false;
  return getFocusDetailOptions(c) != null;
}

export function normalizeFocusCategory(raw: string | undefined): string {
  return (raw ?? "").trim();
}
