import {
  DEFAULT_REMINDER_CHANNELS,
  DEFAULT_REMINDER_TYPE,
  SMS_MAX_LENGTH,
  channelsFromReminderType,
  normalizeReminderChannels,
  reminderTypeFromChannels,
  stripSmsText,
  type AccountabilityAction,
  type AccountabilityMap,
  type AccountabilityPlan,
  type MapCadence,
  type ReminderChannelFlags,
  type ReminderType,
} from "@/lib/boards/accountabilityMap";

export type ActionGuideOperation = Record<string, unknown> & { type: string };

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function asCadence(v: unknown, fallback: MapCadence = "weekly"): MapCadence {
  if (v === "once" || v === "monthly" || v === "weekly" || v === "daily") return v;
  return fallback;
}

function parseChannels(raw: unknown): ReminderChannelFlags | null {
  if (raw == null) return null;
  return normalizeReminderChannels(raw);
}

function parseReminderType(raw: unknown): ReminderType | null {
  if (raw === "calendar" || raw === "email" || raw === "sms") return raw;
  return null;
}

function withReminderChannels(
  channels: ReminderChannelFlags,
): Pick<AccountabilityAction, "channels" | "reminder_type"> {
  const normalized = normalizeReminderChannels(channels);
  return { channels: normalized, reminder_type: reminderTypeFromChannels(normalized) };
}

function touchMap(map: AccountabilityMap): AccountabilityMap {
  return { ...map, edited_at: new Date().toISOString() };
}

function defaultAction(planId: string, title: string): AccountabilityAction {
  return {
    id: newId("action"),
    plan_id: planId,
    title,
    cadence: "weekly",
    remind_date: null,
    remind_day_of_month: null,
    remind_day_of_week: "monday",
    remind_time: "09:00",
    status: "accepted",
    kind: "action",
    step_type: "task",
    reminder_enabled: true,
    reminder_type: DEFAULT_REMINDER_TYPE,
    channels: { ...DEFAULT_REMINDER_CHANNELS },
    sms_text: null,
    source_evidence: null,
    confidence: null,
  };
}

function normHint(text: string): string {
  return text.trim().toLowerCase().replace(/\s+plan$/, "");
}

function resolveFocusId(map: AccountabilityMap, raw: Record<string, unknown>): string | null {
  if (typeof raw.focus_id === "string" && map.focuses.some((f) => f.id === raw.focus_id)) {
    return raw.focus_id;
  }
  const hint =
    typeof raw.focus_title === "string"
      ? raw.focus_title
      : typeof raw.focus_id === "string"
        ? raw.focus_id
        : "";
  if (!hint.trim()) return null;
  const h = normHint(hint);
  const focus = map.focuses.find((f) => {
    const t = normHint(f.title);
    return t === h || t.includes(h) || h.includes(t);
  });
  return focus?.id ?? null;
}

function resolvePlanId(map: AccountabilityMap, raw: Record<string, unknown>): string | null {
  if (typeof raw.plan_id === "string" && map.plans.some((p) => p.id === raw.plan_id)) {
    return raw.plan_id;
  }
  const hint =
    typeof raw.plan_title === "string"
      ? raw.plan_title
      : typeof raw.focus_title === "string"
        ? raw.focus_title
        : typeof raw.plan_id === "string"
          ? raw.plan_id
          : "";
  if (!hint.trim()) return null;
  const h = normHint(hint);
  const plan = map.plans.find((p) => {
    const pt = normHint(p.title);
    const focus = map.focuses.find((f) => f.id === p.focus_id);
    const ft = normHint(focus?.title ?? "");
    return pt === h || pt.includes(h) || h.includes(pt) || ft === h || ft.includes(h) || h.includes(ft);
  });
  return plan?.id ?? null;
}

function resolveActionId(map: AccountabilityMap, raw: Record<string, unknown>): string | null {
  if (typeof raw.action_id === "string" && map.actions.some((a) => a.id === raw.action_id)) {
    return raw.action_id;
  }
  const hint = typeof raw.action_title === "string" ? raw.action_title : typeof raw.action_id === "string" ? raw.action_id : "";
  if (!hint.trim()) return null;
  const h = normHint(hint);
  const planId = resolvePlanId(map, raw);
  const candidates = planId ? map.actions.filter((a) => a.plan_id === planId) : map.actions;
  const action = candidates.find((a) => {
    const t = normHint(a.title);
    return t === h || t.includes(h) || h.includes(t);
  });
  return action?.id ?? null;
}

function normalizeActionGuideOperation(op: unknown, map: AccountabilityMap): ActionGuideOperation | null {
  if (!op || typeof op !== "object") return null;
  const a = { ...(op as Record<string, unknown>) };
  switch (a.type) {
    case "add_action": {
      const planId = resolvePlanId(map, a);
      if (planId) a.plan_id = planId;
      break;
    }
    case "update_action":
    case "delete_action":
    case "set_channel":
    case "set_timing":
    case "shorten_sms": {
      const actionId = resolveActionId(map, a);
      if (actionId) a.action_id = actionId;
      break;
    }
    case "update_plan":
    case "delete_plan": {
      const planId = resolvePlanId(map, a);
      if (planId) a.plan_id = planId;
      break;
    }
    case "add_plan":
    case "update_focus": {
      const focusId = resolveFocusId(map, a);
      if (focusId) a.focus_id = focusId;
      break;
    }
    default:
      break;
  }
  return a as ActionGuideOperation;
}

export function normalizeActionGuideOperations(
  ops: unknown[],
  map: AccountabilityMap,
): ActionGuideOperation[] {
  return ops
    .map((op) => normalizeActionGuideOperation(op, map))
    .filter((op): op is ActionGuideOperation => op != null);
}

export function isValidActionGuideOperation(op: unknown, map: AccountabilityMap | null): op is ActionGuideOperation {
  if (!op || typeof op !== "object" || !map) return false;
  const a = op as Record<string, unknown>;
  switch (a.type) {
    case "add_action":
      return typeof a.plan_id === "string" && map.plans.some((p) => p.id === a.plan_id);
    case "update_action":
    case "delete_action":
    case "set_channel":
    case "set_timing":
    case "shorten_sms":
      return typeof a.action_id === "string" && map.actions.some((x) => x.id === a.action_id);
    case "update_plan":
    case "delete_plan":
      return typeof a.plan_id === "string" && map.plans.some((p) => p.id === a.plan_id);
    case "add_plan":
      return typeof a.focus_id === "string" && map.focuses.some((f) => f.id === a.focus_id);
    case "update_focus":
      return typeof a.focus_id === "string" && map.focuses.some((f) => f.id === a.focus_id);
    default:
      return false;
  }
}

export function filterValidActionGuideOperations(
  ops: unknown[],
  map: AccountabilityMap | null,
): ActionGuideOperation[] {
  if (!map) return [];
  return normalizeActionGuideOperations(ops, map).filter((op) => isValidActionGuideOperation(op, map));
}

export function applyActionGuideOperations(
  map: AccountabilityMap,
  ops: ActionGuideOperation[],
): { map: AccountabilityMap; applied: number } {
  let next = { ...map };
  let applied = 0;

  for (const op of ops) {
    switch (op.type) {
      case "add_action": {
        const planId = String(op.plan_id);
        const title = typeof op.title === "string" ? op.title.trim() : "";
        if (!title || !next.plans.some((p) => p.id === planId)) break;
        const action = defaultAction(planId, title);
        if (typeof op.cadence === "string") action.cadence = asCadence(op.cadence);
        if (typeof op.remind_day_of_week === "string") action.remind_day_of_week = op.remind_day_of_week;
        if (typeof op.remind_date === "string") action.remind_date = op.remind_date;
        if (typeof op.remind_day_of_month === "number") action.remind_day_of_month = op.remind_day_of_month;
        if (typeof op.remind_time === "string") action.remind_time = op.remind_time;
        const reminderType = parseReminderType(op.reminder_type);
        const channels = reminderType
          ? channelsFromReminderType(reminderType)
          : parseChannels(op.channels);
        if (channels) {
          const normalized = withReminderChannels(channels);
          action.channels = normalized.channels;
          action.reminder_type = normalized.reminder_type;
        }
        if (typeof op.sms_text === "string") {
          action.sms_text = stripSmsText(op.sms_text).slice(0, SMS_MAX_LENGTH) || null;
        }
        next = { ...next, actions: [...next.actions, action] };
        applied += 1;
        break;
      }
      case "update_action": {
        const actionId = String(op.action_id);
        const patch = op.patch;
        if (!patch || typeof patch !== "object") break;
        const p = patch as Partial<AccountabilityAction> & { channels?: ReminderChannelFlags };
        next = {
          ...next,
          actions: next.actions.map((a) => {
            if (a.id !== actionId) return a;
            const reminderType = parseReminderType(p.reminder_type);
            const channels = reminderType
              ? channelsFromReminderType(reminderType)
              : parseChannels(p.channels);
            const sms_text =
              typeof p.sms_text === "string"
                ? stripSmsText(p.sms_text).slice(0, SMS_MAX_LENGTH) || null
                : p.sms_text === null
                  ? null
                  : a.sms_text;
            const reminderPatch = channels ? withReminderChannels(channels) : null;
            return {
              ...a,
              ...p,
              cadence: p.cadence ? asCadence(p.cadence, a.cadence) : a.cadence,
              remind_date: typeof p.remind_date === "string" ? p.remind_date : p.remind_date === null ? null : a.remind_date,
              remind_day_of_month:
                typeof p.remind_day_of_month === "number" ? p.remind_day_of_month : a.remind_day_of_month,
              remind_day_of_week:
                typeof p.remind_day_of_week === "string" ? p.remind_day_of_week : a.remind_day_of_week,
              remind_time: typeof p.remind_time === "string" ? p.remind_time : a.remind_time,
              channels: reminderPatch?.channels ?? a.channels,
              reminder_type: reminderPatch?.reminder_type ?? a.reminder_type,
              sms_text,
            };
          }),
        };
        applied += 1;
        break;
      }
      case "delete_action": {
        const actionId = String(op.action_id);
        next = { ...next, actions: next.actions.filter((a) => a.id !== actionId) };
        applied += 1;
        break;
      }
      case "add_plan": {
        const focusId = String(op.focus_id);
        const title = typeof op.title === "string" ? op.title.trim() : "";
        if (!title || !next.focuses.some((f) => f.id === focusId)) break;
        const plan: AccountabilityPlan = {
          id: newId("plan"),
          focus_id: focusId,
          title,
          cadence: "monthly",
          remind_day_of_month: null,
          remind_day_of_week: null,
          remind_time: null,
          status: "accepted",
        };
        next = { ...next, plans: [...next.plans, plan] };
        applied += 1;
        break;
      }
      case "update_plan": {
        const planId = String(op.plan_id);
        const patch = op.patch;
        if (!patch || typeof patch !== "object") break;
        next = {
          ...next,
          plans: next.plans.map((p) => (p.id === planId ? { ...p, ...(patch as Partial<AccountabilityPlan>) } : p)),
        };
        applied += 1;
        break;
      }
      case "delete_plan": {
        const planId = String(op.plan_id);
        next = {
          ...next,
          plans: next.plans.filter((p) => p.id !== planId),
          actions: next.actions.filter((a) => a.plan_id !== planId),
        };
        applied += 1;
        break;
      }
      case "update_focus": {
        const focusId = String(op.focus_id);
        const patch = op.patch;
        if (!patch || typeof patch !== "object") break;
        next = {
          ...next,
          focuses: next.focuses.map((f) => (f.id === focusId ? { ...f, ...(patch as { title?: string }) } : f)),
        };
        applied += 1;
        break;
      }
      case "set_channel": {
        const actionId = String(op.action_id);
        const reminderType = parseReminderType(op.reminder_type);
        const channels = reminderType
          ? channelsFromReminderType(reminderType)
          : parseChannels(op.channels);
        if (!channels) break;
        const normalized = withReminderChannels(channels);
        next = {
          ...next,
          actions: next.actions.map((a) =>
            a.id === actionId
              ? {
                  ...a,
                  channels: normalized.channels,
                  reminder_type: normalized.reminder_type,
                  reminder_enabled: true,
                  sms_text: normalized.reminder_type === "sms" ? a.sms_text ?? stripSmsText(a.title).slice(0, SMS_MAX_LENGTH) : null,
                }
              : a,
          ),
        };
        applied += 1;
        break;
      }
      case "set_timing": {
        const actionId = String(op.action_id);
        next = {
          ...next,
          actions: next.actions.map((a) => {
            if (a.id !== actionId) return a;
            return {
              ...a,
              cadence: typeof op.cadence === "string" ? asCadence(op.cadence, a.cadence) : a.cadence,
              remind_date: typeof op.remind_date === "string" ? op.remind_date : a.remind_date,
              remind_time: typeof op.remind_time === "string" ? op.remind_time : a.remind_time,
              remind_day_of_week:
                typeof op.remind_day_of_week === "string" ? op.remind_day_of_week : a.remind_day_of_week,
              remind_day_of_month:
                typeof op.remind_day_of_month === "number" ? op.remind_day_of_month : a.remind_day_of_month,
            };
          }),
        };
        applied += 1;
        break;
      }
      case "shorten_sms": {
        const actionId = String(op.action_id);
        const sms = typeof op.sms_text === "string" ? stripSmsText(op.sms_text).slice(0, SMS_MAX_LENGTH) : "";
        if (!sms) break;
        next = {
          ...next,
          actions: next.actions.map((a) =>
            a.id === actionId
              ? {
                  ...a,
                  sms_text: sms,
                  ...withReminderChannels(channelsFromReminderType("sms")),
                }
              : a,
          ),
        };
        applied += 1;
        break;
      }
      default:
        break;
    }
  }

  return { map: touchMap(next), applied };
}
