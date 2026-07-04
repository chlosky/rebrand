export type LifeRebrandQuizResultId =
  | "vision_dreamer"
  | "scattered_starter"
  | "stuck_resetter"
  | "aesthetic_curator"
  | "space_builder";

export type LifeRebrandQuizQuestionOptionMeta = {
  key: string;
  resultId: LifeRebrandQuizResultId;
  points: number;
};

export type LifeRebrandQuizQuestionMeta = {
  id: string;
  options: LifeRebrandQuizQuestionOptionMeta[];
};

/** Tie-break priority (highest first). */
export const LIFE_REBRAND_QUIZ_TIE_PRIORITY: LifeRebrandQuizResultId[] = [
  "scattered_starter",
  "stuck_resetter",
  "vision_dreamer",
  "aesthetic_curator",
  "space_builder",
];

export const LIFE_REBRAND_QUIZ_QUESTION_META: LifeRebrandQuizQuestionMeta[] = [
  {
    id: "q1",
    options: [
      { key: "big_picture_blurry", resultId: "vision_dreamer", points: 2 },
      { key: "too_many_directions", resultId: "scattered_starter", points: 2 },
      { key: "freeze", resultId: "stuck_resetter", points: 2 },
      { key: "collect_inspiration", resultId: "aesthetic_curator", points: 2 },
    ],
  },
  {
    id: "q2",
    options: [
      { key: "nothing_visual", resultId: "vision_dreamer", points: 2 },
      { key: "no_system", resultId: "scattered_starter", points: 2 },
      { key: "lost_steam", resultId: "stuck_resetter", points: 2 },
      { key: "space_mismatch", resultId: "space_builder", points: 2 },
    ],
  },
  {
    id: "q3",
    options: [
      { key: "daydreamer", resultId: "vision_dreamer", points: 2 },
      { key: "ten_ideas", resultId: "scattered_starter", points: 2 },
      { key: "vibe_first", resultId: "aesthetic_curator", points: 2 },
      { key: "grinder_no_setup", resultId: "space_builder", points: 2 },
    ],
  },
  {
    id: "q4",
    options: [
      { key: "make_concrete", resultId: "vision_dreamer", points: 2 },
      { key: "stay_consistent", resultId: "stuck_resetter", points: 2 },
      { key: "make_cohesive", resultId: "aesthetic_curator", points: 2 },
      { key: "build_environment", resultId: "space_builder", points: 2 },
    ],
  },
  {
    id: "q5",
    options: [
      { key: "one_system", resultId: "scattered_starter", points: 2 },
      { key: "small_start", resultId: "stuck_resetter", points: 2 },
      { key: "moodboard", resultId: "aesthetic_curator", points: 2 },
      { key: "home_office", resultId: "space_builder", points: 2 },
    ],
  },
];

export function scoreLifeRebrandQuiz(
  answers: LifeRebrandQuizResultId[],
): LifeRebrandQuizResultId {
  const totals: Record<LifeRebrandQuizResultId, number> = {
    vision_dreamer: 0,
    scattered_starter: 0,
    stuck_resetter: 0,
    aesthetic_curator: 0,
    space_builder: 0,
  };

  for (const id of answers) {
    totals[id] += 2;
  }

  let bestScore = -1;
  let winner: LifeRebrandQuizResultId = LIFE_REBRAND_QUIZ_TIE_PRIORITY[0];

  for (const id of LIFE_REBRAND_QUIZ_TIE_PRIORITY) {
    if (totals[id] > bestScore) {
      bestScore = totals[id];
      winner = id;
    }
  }

  return winner;
}
