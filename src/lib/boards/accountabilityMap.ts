export type ActionItemStatus = "suggested" | "accepted" | "rejected";

export type MapCadence = "monthly" | "weekly" | "daily";

export type AccountabilityFocus = {
  id: string;
  board_id: string;
  title: string;
};

export type AccountabilityReviewCycle = {
  title: string;
  remind_date: string | null;
  remind_time: string | null;
};

export type AccountabilityPlan = {
  id: string;
  focus_id: string;
  title: string;
  cadence: MapCadence;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  status: ActionItemStatus;
};

export type AccountabilityAction = {
  id: string;
  plan_id: string;
  title: string;
  cadence: MapCadence;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  status: ActionItemStatus;
  kind: "action" | "micro";
};

export type AccountabilityReminderCadence = "quarterly" | "monthly" | "weekly" | "daily";

export type AccountabilityReminder = {
  title: string;
  cadence: AccountabilityReminderCadence;
  goal_title: string;
  channels: string[];
  remind_date?: string | null;
  remind_time?: string | null;
  day_of_month?: number | null;
  day_of_week?: string | null;
};

export type AccountabilityMap = {
  version: 2;
  summary: string;
  finalized: boolean;
  review_cycle: AccountabilityReviewCycle;
  focuses: AccountabilityFocus[];
  plans: AccountabilityPlan[];
  actions: AccountabilityAction[];
  reminders: AccountabilityReminder[];
};

export const WEEKDAY_OPTIONS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAILY_TIME_QUICK_OPTIONS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "12:00",
  "15:00",
  "18:00",
  "20:00",
  "22:00",
] as const;

export const CADENCE_OPTIONS: MapCadence[] = ["monthly", "weekly", "daily"];

const DEFAULT_TIME = "09:00";

function defaultReviewDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asStatus(v: unknown): ActionItemStatus {
  if (v === "accepted" || v === "rejected" || v === "suggested") return v;
  return "suggested";
}

function asCadence(v: unknown, fallback: MapCadence = "weekly"): MapCadence {
  if (v === "monthly" || v === "weekly" || v === "daily") return v;
  return fallback;
}

export function isJunkBoardText(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return true;
  if (t === "untitled") return true;
  if (/^\+?\s*add\s*line\.?$/.test(t)) return true;
  if (/^add\s*(row|line)\.?$/.test(t)) return true;
  if (/add\s*line/.test(t) && t.length <= 32) return true;
  return false;
}

export function naturalizeTitle(title: string): string {
  const t = title
    .replace(/\+?\s*add\s*line/gi, "")
    .replace(/\badd\s*line\b/gi, "")
    .replace(/^Monthly goal:\s*/i, "")
    .replace(/^Weekly touchpoint\s*[—-]\s*/i, "")
    .replace(/^From The Plan:\s*/i, "")
    .replace(/^5-minute action toward\s*/i, "")
    .replace(/\s*[—-]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return isJunkBoardText(t) ? "" : t;
}

export function stripChromeFromInput(text: string): string {
  return text.replace(/\+?\s*add\s*line/gi, "").replace(/\badd\s*line\b/gi, "");
}

export function sanitizeNodeTitle(title: string, fallback: string): string {
  const cleaned = naturalizeTitle(title);
  return cleaned || fallback;
}

export function scrubMapTitles(map: AccountabilityMap): AccountabilityMap {
  const focusName = (id: string) => map.focuses.find((f) => f.id === id)?.title ?? "Focus";

  const plans = map.plans.map((p) => ({
    ...p,
    title: sanitizeNodeTitle(p.title, focusName(p.focus_id)),
  }));

  const planTitle = (id: string) => plans.find((p) => p.id === id)?.title ?? "Action";

  const actions = map.actions.map((a) => ({
    ...a,
    title: sanitizeNodeTitle(a.title, planTitle(a.plan_id)),
  }));

  return { ...map, plans, actions };
}

function timeFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dayOfWeekFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return WEEKDAY_OPTIONS[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? "monday";
}

function dayOfMonthFromDate(date: string): number | null {
  const n = parseInt(date.slice(8, 10), 10);
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
}

function normalizeReviewCycle(raw: Record<string, unknown>): AccountabilityReviewCycle {
  const remind_date =
    asString(raw.remind_date) ?? asString(raw.check_in_date) ?? defaultReviewDate();
  return {
    title: asString(raw.title) ?? "Accountability review",
    remind_date,
    remind_time: asString(raw.remind_time) ?? DEFAULT_TIME,
  };
}

function normalizePlan(raw: Record<string, unknown>): AccountabilityPlan {
  const cadence = asCadence(raw.cadence, "monthly");
  let remind_day_of_month: number | null =
    typeof raw.remind_day_of_month === "number" ? raw.remind_day_of_month : null;
  let remind_day_of_week = asString(raw.remind_day_of_week);
  let remind_time = asString(raw.remind_time);

  if (cadence === "monthly" && remind_day_of_month == null && asString(raw.check_in_date)) {
    remind_day_of_month = dayOfMonthFromDate(raw.check_in_date as string);
  }
  if (asString(raw.remind_at)) {
    const iso = raw.remind_at as string;
    if (!remind_day_of_week) remind_day_of_week = dayOfWeekFromIso(iso);
    if (!remind_time) remind_time = timeFromIso(iso);
  }

  if (cadence === "monthly" && remind_day_of_month == null) remind_day_of_month = 1;
  if (cadence === "weekly" && !remind_day_of_week) remind_day_of_week = "monday";
  if (!remind_time) remind_time = DEFAULT_TIME;

  return {
    id: asString(raw.id) ?? `plan-${crypto.randomUUID().slice(0, 8)}`,
    focus_id: asString(raw.focus_id) ?? "",
    title: naturalizeTitle(asString(raw.title) ?? ""),
    cadence,
    remind_day_of_month: cadence === "monthly" ? remind_day_of_month : null,
    remind_day_of_week: cadence === "weekly" ? remind_day_of_week : null,
    remind_time,
    status: asStatus(raw.status),
  };
}

function normalizeAction(raw: Record<string, unknown>): AccountabilityAction {
  const cadence = asCadence(raw.cadence, "weekly");
  let remind_day_of_month: number | null =
    typeof raw.remind_day_of_month === "number" ? raw.remind_day_of_month : null;
  let remind_day_of_week = asString(raw.remind_day_of_week);
  let remind_time = asString(raw.remind_time);

  if (asString(raw.remind_at)) {
    const iso = raw.remind_at as string;
    if (!remind_day_of_week) remind_day_of_week = dayOfWeekFromIso(iso);
    if (!remind_time) remind_time = timeFromIso(iso);
  }

  if (cadence === "monthly" && remind_day_of_month == null) remind_day_of_month = 1;
  if (cadence === "weekly" && !remind_day_of_week) remind_day_of_week = "monday";
  if (!remind_time) remind_time = DEFAULT_TIME;

  const kind = raw.kind === "micro" ? "micro" : "action";

  return {
    id: asString(raw.id) ?? `action-${crypto.randomUUID().slice(0, 8)}`,
    plan_id: asString(raw.plan_id) ?? asString(raw.weekly_action_id) ?? "",
    title: naturalizeTitle(asString(raw.title) ?? ""),
    cadence,
    remind_day_of_month: cadence === "monthly" ? remind_day_of_month : null,
    remind_day_of_week: cadence === "weekly" ? remind_day_of_week : null,
    remind_time,
    status: asStatus(raw.status),
    kind,
  };
}

function migrateLegacyMap(o: Record<string, unknown>): { plans: AccountabilityPlan[]; actions: AccountabilityAction[] } {
  const plans: AccountabilityPlan[] = [];
  const actions: AccountabilityAction[] = [];

  const monthlies = Array.isArray(o.monthly_goals) ? o.monthly_goals : [];
  const weeklies = Array.isArray(o.weekly_actions) ? o.weekly_actions : [];
  const dailies = Array.isArray(o.daily_actions) ? o.daily_actions : [];

  for (const raw of monthlies) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    plans.push(normalizePlan({ ...row, cadence: "monthly" }));
  }

  for (const raw of weeklies) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const monthly = monthlies.find(
      (m) => m && typeof m === "object" && (m as Record<string, unknown>).id === row.monthly_goal_id,
    ) as Record<string, unknown> | undefined;
    plans.push(
      normalizePlan({
        ...row,
        focus_id: monthly?.focus_id ?? row.focus_id,
        cadence: "weekly",
      }),
    );
  }

  for (const raw of dailies) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    actions.push(
      normalizeAction({
        ...row,
        plan_id: row.weekly_action_id,
        cadence: "daily",
        kind: "micro",
      }),
    );
  }

  return { plans, actions };
}

export function isAccountabilityMapV2(raw: unknown): raw is AccountabilityMap {
  return (
    !!raw &&
    typeof raw === "object" &&
    (raw as AccountabilityMap).version === 2 &&
    Array.isArray((raw as AccountabilityMap).focuses)
  );
}

export function normalizeAccountabilityMap(raw: unknown): AccountabilityMap | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 2 || !Array.isArray(o.focuses)) return null;

  const focuses = (o.focuses as unknown[])
    .filter((f) => f && typeof f === "object")
    .map((f) => {
      const row = f as Record<string, unknown>;
      return {
        id: asString(row.id) ?? "",
        board_id: asString(row.board_id) ?? "",
        title: asString(row.title) ?? "",
      };
    })
    .filter((f) => f.id && f.title);

  if (!focuses.length) return null;

  let plans: AccountabilityPlan[];
  let actions: AccountabilityAction[];

  if (Array.isArray(o.plans)) {
    plans = (o.plans as unknown[]).map((p) => normalizePlan(p as Record<string, unknown>));
    actions = Array.isArray(o.actions)
      ? (o.actions as unknown[]).map((a) => normalizeAction(a as Record<string, unknown>))
      : [];
  } else {
    const migrated = migrateLegacyMap(o);
    plans = migrated.plans;
    actions = migrated.actions;
  }

  return scrubMapTitles({
    version: 2,
    summary: asString(o.summary) ?? "",
    finalized: Boolean(o.finalized),
    review_cycle: normalizeReviewCycle(
      ((o.review_cycle ?? o.quarterly_reset) as Record<string, unknown>) ?? {},
    ),
    focuses,
    plans,
    actions,
    reminders: Array.isArray(o.reminders) ? (o.reminders as AccountabilityReminder[]) : [],
  });
}

function pushNodeReminder(
  reminders: AccountabilityReminder[],
  node: {
    title: string;
    cadence: MapCadence;
    remind_day_of_month: number | null;
    remind_day_of_week: string | null;
    remind_time: string | null;
  },
  goalTitle: string,
) {
  if (!node.title.trim()) return;
  if (node.cadence === "monthly") {
    reminders.push({
      title: node.title,
      cadence: "monthly",
      goal_title: goalTitle,
      channels: ["email"],
      day_of_month: node.remind_day_of_month ?? 1,
      remind_time: node.remind_time ?? DEFAULT_TIME,
    });
  } else if (node.cadence === "weekly") {
    reminders.push({
      title: node.title,
      cadence: "weekly",
      goal_title: goalTitle,
      channels: ["email"],
      day_of_week: node.remind_day_of_week ?? "monday",
      remind_time: node.remind_time ?? DEFAULT_TIME,
    });
  } else {
    reminders.push({
      title: node.title,
      cadence: "daily",
      goal_title: goalTitle,
      channels: ["email"],
      remind_time: node.remind_time ?? DEFAULT_TIME,
    });
  }
}

export function buildRemindersFromMap(map: AccountabilityMap): AccountabilityReminder[] {
  const reminders: AccountabilityReminder[] = [];
  const focusTitle = (focusId: string) => map.focuses.find((f) => f.id === focusId)?.title ?? "";

  if (map.review_cycle.title.trim()) {
    reminders.push({
      title: map.review_cycle.title,
      cadence: "quarterly",
      goal_title: "All focuses",
      channels: ["email"],
      remind_date: map.review_cycle.remind_date,
      remind_time: map.review_cycle.remind_time ?? DEFAULT_TIME,
    });
  }

  for (const action of map.actions) {
    if (action.status === "rejected") continue;
    const plan = map.plans.find((p) => p.id === action.plan_id);
    pushNodeReminder(reminders, action, plan ? focusTitle(plan.focus_id) : "");
  }

  return reminders.slice(0, 20);
}

function parseHm(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 };
}

function setLocalTime(d: Date, time: string) {
  const { h, m } = parseHm(time);
  d.setHours(h, m, 0, 0);
}

function weekdayIndex(day: string): number {
  const i = WEEKDAY_OPTIONS.indexOf(day.toLowerCase() as (typeof WEEKDAY_OPTIONS)[number]);
  return i >= 0 ? i : 0;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function reminderToIso(reminder: AccountabilityReminder, from = new Date()): string {
  const time = reminder.remind_time ?? DEFAULT_TIME;

  if (reminder.cadence === "quarterly" && reminder.remind_date) {
    const d = new Date(`${reminder.remind_date}T00:00:00`);
    setLocalTime(d, time);
    if (d.getTime() <= from.getTime()) {
      d.setMonth(d.getMonth() + 3);
    }
    return d.toISOString();
  }

  if (reminder.cadence === "monthly") {
    const dom = reminder.day_of_month ?? 1;
    const d = new Date(from);
    if (dom === -1) {
      d.setDate(lastDayOfMonth(d.getFullYear(), d.getMonth()));
    } else {
      d.setDate(Math.min(dom, lastDayOfMonth(d.getFullYear(), d.getMonth())));
    }
    setLocalTime(d, time);
    if (d.getTime() <= from.getTime()) {
      d.setMonth(d.getMonth() + 1);
      if (dom === -1) {
        d.setDate(lastDayOfMonth(d.getFullYear(), d.getMonth()));
      } else {
        d.setDate(Math.min(dom, lastDayOfMonth(d.getFullYear(), d.getMonth())));
      }
      setLocalTime(d, time);
    }
    return d.toISOString();
  }

  if (reminder.cadence === "weekly") {
    const target = weekdayIndex(reminder.day_of_week ?? "monday");
    const d = new Date(from);
    const current = d.getDay() === 0 ? 6 : d.getDay() - 1;
    let delta = target - current;
    if (delta < 0) delta += 7;
    d.setDate(d.getDate() + delta);
    setLocalTime(d, time);
    if (d.getTime() <= from.getTime()) {
      d.setDate(d.getDate() + 7);
    }
    return d.toISOString();
  }

  const d = new Date(from);
  setLocalTime(d, time);
  if (d.getTime() <= from.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

export function finalizeAccountabilityMap(map: AccountabilityMap): AccountabilityMap {
  const accept = <T extends { status: ActionItemStatus }>(item: T): T => ({
    ...item,
    status: item.status === "rejected" ? "rejected" : "accepted",
  });

  const next: AccountabilityMap = {
    ...map,
    finalized: true,
    plans: map.plans.map(accept),
    actions: map.actions.map(accept),
    reminders: [],
  };
  next.reminders = buildRemindersFromMap(next);
  return next;
}
