export type AccountabilityDaily = string;

export type AccountabilityWeekly = {
  title: string;
  daily: AccountabilityDaily[];
};

export type AccountabilityMonthly = {
  title: string;
  weekly: AccountabilityWeekly[];
};

export type AccountabilityQuarterly = {
  title: string;
  monthly: AccountabilityMonthly[];
};

export type AccountabilityGoal = {
  id: string;
  title: string;
  board_id: string;
  board_title: string;
  board_role: string;
  priority?: string;
  rationale: string;
  quarterly: AccountabilityQuarterly[];
};

export type AccountabilityReminder = {
  title: string;
  cadence: string;
  goal_title: string;
  days_from_now: number;
  channels: string[];
};

export type AccountabilityMap = {
  summary: string;
  goals: AccountabilityGoal[];
  reminders: AccountabilityReminder[];
};
