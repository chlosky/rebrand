export type ManifestationQuizResultId =
  | "three_d_checker"
  | "waver"
  | "method_hopper"
  | "old_story_repeater"
  | "no_routine_manifestor";

export type ManifestationQuizQuestionOptionMeta = {
  key: string;
  resultId: ManifestationQuizResultId;
  points: number;
};

export type ManifestationQuizQuestionMeta = {
  id: string;
  options: ManifestationQuizQuestionOptionMeta[];
};

/** Tie-break priority (highest first). */
export const MANIFESTATION_QUIZ_TIE_PRIORITY: ManifestationQuizResultId[] = [
  "old_story_repeater",
  "waver",
  "three_d_checker",
  "method_hopper",
  "no_routine_manifestor",
];

export const MANIFESTATION_QUIZ_QUESTION_META: ManifestationQuizQuestionMeta[] = [
  {
    id: "q1",
    options: [
      { key: "check_signs", resultId: "three_d_checker", points: 2 },
      { key: "rewrite", resultId: "method_hopper", points: 2 },
      { key: "spiral", resultId: "waver", points: 2 },
      { key: "stop", resultId: "no_routine_manifestor", points: 2 },
    ],
  },
  {
    id: "q2",
    options: [
      { key: "opposite_3d", resultId: "three_d_checker", points: 2 },
      { key: "intrusive", resultId: "waver", points: 2 },
      { key: "starting_over", resultId: "method_hopper", points: 2 },
      { key: "old_assumptions", resultId: "old_story_repeater", points: 2 },
    ],
  },
  {
    id: "q3",
    options: [
      { key: "checking", resultId: "three_d_checker", points: 2 },
      { key: "confident_panic", resultId: "waver", points: 2 },
      { key: "every_method", resultId: "method_hopper", points: 2 },
      { key: "replaying", resultId: "old_story_repeater", points: 2 },
    ],
  },
  {
    id: "q4",
    options: [
      { key: "ignoring_3d", resultId: "three_d_checker", points: 2 },
      { key: "steady", resultId: "waver", points: 2 },
      { key: "one_approach", resultId: "method_hopper", points: 2 },
      { key: "daily_practice", resultId: "no_routine_manifestor", points: 2 },
    ],
  },
  {
    id: "q5",
    options: [
      { key: "detachment", resultId: "three_d_checker", points: 2 },
      { key: "stabilize", resultId: "waver", points: 2 },
      { key: "simple_system", resultId: "method_hopper", points: 2 },
      { key: "daily_routine", resultId: "no_routine_manifestor", points: 2 },
    ],
  },
];

export const MANIFESTATION_QUIZ_RESULT_GUIDE_SLUGS: Record<ManifestationQuizResultId, string> = {
  three_d_checker: "living-in-the-end-without-pretending-you-never-notice-the-3d",
  waver: "how-to-stop-re-deciding-your-desire-every-time-the-3d-looks-quiet",
  method_hopper: "self-concept-affirmations-for-people-who-are-tired-of-method-hopping",
  old_story_repeater: "revision-how-to-stop-replaying-the-version-of-the-story-you-do-not-want",
  no_routine_manifestor:
    "a-self-concept-routine-that-does-not-require-ten-different-manifestation-methods",
};

export function scoreManifestationQuiz(
  answers: ManifestationQuizResultId[],
): ManifestationQuizResultId {
  const totals: Record<ManifestationQuizResultId, number> = {
    three_d_checker: 0,
    waver: 0,
    method_hopper: 0,
    old_story_repeater: 0,
    no_routine_manifestor: 0,
  };

  for (const id of answers) {
    totals[id] += 2;
  }

  let bestScore = -1;
  let winner: ManifestationQuizResultId = MANIFESTATION_QUIZ_TIE_PRIORITY[0];

  for (const id of MANIFESTATION_QUIZ_TIE_PRIORITY) {
    if (totals[id] > bestScore) {
      bestScore = totals[id];
      winner = id;
    }
  }

  return winner;
}
