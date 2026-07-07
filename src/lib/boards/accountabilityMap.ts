export type ActionItemStatus = "suggested" | "accepted" | "rejected";

export type MapCadence = "once" | "monthly" | "weekly" | "daily";

export type StepType =
  | "task"
  | "deadline"
  | "appointment"
  | "purchase"
  | "follow_up"
  | "review"
  | "custom";

export type ReminderType = "calendar" | "email" | "sms";

export type ReminderChannelFlags = {
  calendar: boolean;
  email: boolean;
  sms: boolean;
};

export const DEFAULT_REMINDER_TYPE: ReminderType = "email";

export const DEFAULT_REMINDER_CHANNELS: ReminderChannelFlags = {
  calendar: false,
  email: true,
  sms: false,
};

export function channelsFromReminderType(type: ReminderType): ReminderChannelFlags {
  return { calendar: type === "calendar", email: type === "email", sms: type === "sms" };
}

export function reminderTypeFromChannels(channels: ReminderChannelFlags): ReminderType {
  if (channels.sms) return "sms";
  if (channels.calendar) return "calendar";
  return "email";
}

/** Enforce exactly one reminder channel per Action. */
export function normalizeReminderChannels(raw: unknown): ReminderChannelFlags {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_REMINDER_CHANNELS };
  const o = raw as Record<string, unknown>;
  if (typeof o.reminder_type === "string") {
    const t = o.reminder_type as ReminderType;
    if (t === "calendar" || t === "email" || t === "sms") {
      return channelsFromReminderType(t);
    }
  }
  const flags: ReminderChannelFlags = {
    calendar: o.calendar === true,
    email: o.email === true,
    sms: o.sms === true,
  };
  const active = (["sms", "calendar", "email"] as ReminderType[]).filter((t) => flags[t]);
  if (active.length === 1) return channelsFromReminderType(active[0]);
  if (active.length > 1) return channelsFromReminderType(active[0]);
  return { ...DEFAULT_REMINDER_CHANNELS };
}

export function reminderChannelsArray(type: ReminderType): string[] {
  return [type];
}

export const STEP_TYPE_OPTIONS: StepType[] = [
  "task",
  "deadline",
  "appointment",
  "purchase",
  "follow_up",
  "review",
  "custom",
];

export const SMS_MAX_LENGTH = 70;

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
  remind_date: string | null;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  status: ActionItemStatus;
  kind: "action" | "micro";
  step_type: StepType;
  reminder_enabled: boolean;
  reminder_type: ReminderType;
  channels: ReminderChannelFlags;
  sms_text: string | null;
  source_evidence: string | null;
  confidence: number | null;
};

export type AccountabilityReminderCadence = "quarterly" | "monthly" | "weekly" | "daily";

export type AccountabilityReminder = {
  title: string;
  cadence: AccountabilityReminderCadence;
  goal_title: string;
  plan_title: string;
  reminder_type: ReminderType;
  channels: string[];
  action_id: string;
  plan_id: string;
  focus_id: string;
  remind_date?: string | null;
  remind_time?: string | null;
  day_of_month?: number | null;
  day_of_week?: string | null;
  sms_text?: string | null;
  details?: string | null;
};

export type AccountabilityMap = {
  version: 2;
  summary: string;
  finalized: boolean;
  analysis_status?: "draft" | "draft_ready" | "needs_more_content" | "finalized";
  analyzed_at?: string | null;
  edited_at?: string | null;
  finalized_at?: string | null;
  meta_confidence?: number | null;
  unmapped_items?: { text: string; reason: string }[];
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

export const CADENCE_OPTIONS: MapCadence[] = ["once", "monthly", "weekly", "daily"];

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
  if (v === "once" || v === "monthly" || v === "weekly" || v === "daily") return v;
  return fallback;
}

function asStepType(v: unknown): StepType {
  const allowed: StepType[] = [
    "task",
    "deadline",
    "appointment",
    "purchase",
    "follow_up",
    "review",
    "custom",
  ];
  return allowed.includes(v as StepType) ? (v as StepType) : "task";
}

export function sanitizeSmsReminder(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripSmsText(text: string): string {
  return sanitizeSmsReminder(text);
}

export function isValidSmsReminderText(text: string): boolean {
  const content = sanitizeSmsReminder(text);
  if (!content) return false;
  if (content.length > SMS_MAX_LENGTH) return false;
  if (/https?:\/\//i.test(content)) return false;
  return true;
}

export function smsTextFromTitle(title: string): string {
  return stripSmsText(title).slice(0, SMS_MAX_LENGTH);
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
  if (cadence === "monthly" && remind_day_of_month !== -1 && remind_day_of_month != null) {
    remind_day_of_month = Math.min(31, Math.max(1, remind_day_of_month));
  }
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
  let remind_date = asString(raw.remind_date);

  const reminder =
    raw.reminder && typeof raw.reminder === "object" ? (raw.reminder as Record<string, unknown>) : null;

  if (asString(raw.remind_at)) {
    const iso = raw.remind_at as string;
    if (!remind_day_of_week) remind_day_of_week = dayOfWeekFromIso(iso);
    if (!remind_time) remind_time = timeFromIso(iso);
    if (!remind_date) remind_date = iso.slice(0, 10);
  }

  if (cadence === "monthly" && remind_day_of_month == null) remind_day_of_month = 1;
  if (cadence === "monthly" && remind_day_of_month !== -1 && remind_day_of_month != null) {
    remind_day_of_month = Math.min(31, Math.max(1, remind_day_of_month));
  }
  if (cadence === "weekly" && !remind_day_of_week) remind_day_of_week = "monday";
  if (!remind_time) remind_time = DEFAULT_TIME;

  const kind = raw.kind === "micro" ? "micro" : "action";
  const channelSource = reminder?.channels ?? raw.channels ?? raw.reminder_type;
  const channels = normalizeReminderChannels(
    typeof raw.reminder_type === "string" ? { reminder_type: raw.reminder_type } : channelSource,
  );
  const reminder_type = reminderTypeFromChannels(channels);
  const smsRaw =
    asString(raw.sms_text) ??
    asString(reminder?.smsText) ??
    asString(reminder?.sms_text) ??
    null;
  const sms_text = smsRaw ? stripSmsText(smsRaw).slice(0, SMS_MAX_LENGTH) : null;

  return {
    id: asString(raw.id) ?? `action-${crypto.randomUUID().slice(0, 8)}`,
    plan_id: asString(raw.plan_id) ?? asString(raw.weekly_action_id) ?? "",
    title: naturalizeTitle(asString(raw.title) ?? ""),
    cadence,
    remind_date,
    remind_day_of_month: cadence === "monthly" ? remind_day_of_month : null,
    remind_day_of_week: cadence === "weekly" ? remind_day_of_week : null,
    remind_time,
    status: asStatus(raw.status),
    kind,
    step_type: asStepType(raw.step_type ?? raw.type),
    reminder_enabled: reminder?.enabled !== false && raw.reminder_enabled !== false,
    reminder_type,
    channels,
    sms_text,
    source_evidence:
      asString(raw.source_evidence) ??
      (Array.isArray((raw.source as Record<string, unknown> | undefined)?.evidence)
        ? ((raw.source as { evidence: string[] }).evidence[0] ?? null)
        : null),
    confidence: typeof raw.confidence === "number" ? raw.confidence : null,
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
        reminder_enabled: true,
        channels: DEFAULT_REMINDER_CHANNELS,
        reminder_type: DEFAULT_REMINDER_TYPE,
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
    analysis_status:
      o.analysis_status === "draft_ready" ||
      o.analysis_status === "needs_more_content" ||
      o.analysis_status === "finalized" ||
      o.analysis_status === "draft"
        ? o.analysis_status
        : "draft_ready",
    analyzed_at: asString(o.analyzed_at),
    edited_at: asString(o.edited_at),
    finalized_at: asString(o.finalized_at),
    meta_confidence: typeof o.meta_confidence === "number" ? o.meta_confidence : null,
    unmapped_items: Array.isArray(o.unmapped_items)
      ? (o.unmapped_items as { text: string; reason: string }[])
      : [],
    review_cycle: normalizeReviewCycle(
      ((o.review_cycle ?? o.quarterly_reset) as Record<string, unknown>) ?? {},
    ),
    focuses,
    plans,
    actions,
    reminders: Array.isArray(o.reminders) ? (o.reminders as AccountabilityReminder[]) : [],
  });
}

export function buildRemindersFromMap(map: AccountabilityMap): AccountabilityReminder[] {
  const reminders: AccountabilityReminder[] = [];

  const focusTitleForPlan = (planId: string) => {
    const plan = map.plans.find((p) => p.id === planId);
    if (!plan) return "";
    return map.focuses.find((f) => f.id === plan.focus_id)?.title ?? "";
  };

  for (const action of map.actions) {
    if (action.status === "rejected") continue;
    if (!action.reminder_enabled) continue;
    if (!action.title.trim()) continue;

    const plan = map.plans.find((p) => p.id === action.plan_id);
    const focus = plan ? map.focuses.find((f) => f.id === plan.focus_id) : undefined;
    const reminder_type = action.reminder_type ?? reminderTypeFromChannels(action.channels);
    const channels = reminderChannelsArray(reminder_type);
    const sms_text =
      reminder_type === "sms" && action.sms_text
        ? stripSmsText(action.sms_text).slice(0, SMS_MAX_LENGTH)
        : reminder_type === "sms"
          ? smsTextFromTitle(action.title)
          : null;

    const base = {
      title: action.title.trim(),
      goal_title: focus?.title ?? focusTitleForPlan(action.plan_id),
      plan_title: plan?.title ?? "",
      reminder_type,
      channels,
      action_id: action.id,
      plan_id: action.plan_id,
      focus_id: plan?.focus_id ?? "",
      remind_time: action.remind_time ?? DEFAULT_TIME,
      sms_text,
      details: null,
    };

    if (action.cadence === "once") {
      reminders.push({
        ...base,
        cadence: "quarterly",
        remind_date: action.remind_date ?? defaultReviewDate(),
      });
      continue;
    }

    if (action.cadence === "monthly") {
      reminders.push({
        ...base,
        cadence: "monthly",
        day_of_month: action.remind_day_of_month ?? 1,
      });
      continue;
    }

    if (action.cadence === "weekly") {
      reminders.push({
        ...base,
        cadence: "weekly",
        day_of_week: action.remind_day_of_week ?? "monday",
      });
      continue;
    }

    reminders.push({
      ...base,
      cadence: "daily",
    });
  }

  return reminders.slice(0, 20);
}

export type FinalizeValidationResult = { ok: true } | { ok: false; message: string };

export function validateMapForFinalize(map: AccountabilityMap): FinalizeValidationResult {
  const activeActions = map.actions.filter((a) => a.status !== "rejected" && a.reminder_enabled);
  if (activeActions.length === 0) {
    return { ok: false, message: "Add at least one action before finalizing." };
  }
  for (const action of activeActions) {
    if (!action.title.trim()) {
      return { ok: false, message: "Every action needs a title before finalizing." };
    }
    const channels = normalizeReminderChannels(action.channels);
    const activeCount = [channels.calendar, channels.email, channels.sms].filter(Boolean).length;
    if (activeCount !== 1) {
      return { ok: false, message: "Each action must have exactly one reminder type." };
    }
    const reminder_type = reminderTypeFromChannels(channels);
    if (reminder_type === "sms") {
      const sms = action.sms_text ? stripSmsText(action.sms_text) : smsTextFromTitle(action.title);
      if (!isValidSmsReminderText(sms)) {
        return {
          ok: false,
          message: "Text reminders must be 70 characters or less with no links or emoji.",
        };
      }
    }
  }
  return { ok: true };
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
    const requested = reminder.day_of_month ?? 1;
    const d = new Date(from);

    const dom =
      requested === -1
        ? lastDayOfMonth(d.getFullYear(), d.getMonth())
        : Math.min(31, Math.max(1, requested));

    d.setDate(Math.min(dom, lastDayOfMonth(d.getFullYear(), d.getMonth())));
    setLocalTime(d, time);

    if (d.getTime() <= from.getTime()) {
      d.setMonth(d.getMonth() + 1);

      const nextDom =
        requested === -1
          ? lastDayOfMonth(d.getFullYear(), d.getMonth())
          : Math.min(31, Math.max(1, requested));

      d.setDate(Math.min(nextDom, lastDayOfMonth(d.getFullYear(), d.getMonth())));
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
  const validation = validateMapForFinalize(map);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const accept = <T extends { status: ActionItemStatus }>(item: T): T => ({
    ...item,
    status: item.status === "rejected" ? "rejected" : "accepted",
  });

  const now = new Date().toISOString();
  const next: AccountabilityMap = {
    ...map,
    finalized: true,
    analysis_status: "finalized",
    finalized_at: now,
    plans: map.plans.map(accept),
    actions: map.actions.map((action) => {
      const accepted = accept(action);
      const channels = normalizeReminderChannels(accepted.channels);
      return {
        ...accepted,
        channels,
        reminder_type: reminderTypeFromChannels(channels),
      };
    }),
    reminders: [],
  };
  next.reminders = buildRemindersFromMap(next);
  return next;
}
