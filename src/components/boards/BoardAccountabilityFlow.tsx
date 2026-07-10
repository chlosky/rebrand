import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type {
  AccountabilityAction,
  AccountabilityMap,
  AccountabilityPlan,
  MapCadence,
  ReminderChannelFlags,
} from "@/lib/boards/accountabilityMap";
import {
  CADENCE_OPTIONS,
  DEFAULT_REMINDER_CHANNELS,
  DEFAULT_REMINDER_TYPE,
  naturalizeTitle,
  normalizeReminderChannels,
  reminderTypeFromChannels,
  SMS_MAX_LENGTH,
  stripChromeFromInput,
  stripSmsText,
  smsTextFromTitle,
  WEEKDAY_OPTIONS,
} from "@/lib/boards/accountabilityMap";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BoardAccountabilityFlowProps = {
  map: AccountabilityMap | null;
  boards: Board[];
  onChange: (map: AccountabilityMap) => void;
  smsReady?: boolean;
  hasPro?: boolean;
  onRequestSmsSetup?: (actionId: string) => void;
  compact?: boolean;
};

const MAP_GRID = "grid-cols-[240px_minmax(220px,280px)_minmax(440px,520px)]";
const PLAN_ACTION_GRID = "grid-cols-[minmax(220px,280px)_32px_minmax(440px,520px)]";

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function visible<T extends { status: string }>(items: T[]) {
  return items.filter((i) => i.status !== "rejected");
}

function suggestedBorder(status: string) {
  return status === "suggested" ? "border-neutral-300/90" : "border-neutral-200";
}

const PILL_SELECT =
  "h-7 max-w-full shrink-0 rounded-lg border-0 bg-neutral-100 px-1.5 text-[10px] text-neutral-700 outline-none focus:ring-1 focus:ring-neutral-300";

const DELETE_SLOT_CLASS = "flex h-8 w-6 shrink-0 items-center justify-end";

type ReminderType = "calendar" | "email" | "sms";

function primaryReminderType(channels: ReminderChannelFlags): ReminderType {
  if (channels.sms) return "sms";
  if (channels.calendar) return "calendar";
  return "email";
}

function reminderTypeToChannels(type: ReminderType): ReminderChannelFlags {
  return { calendar: type === "calendar", email: type === "email", sms: type === "sms" };
}

function CadenceTimingControls({
  cadence,
  remind_date,
  remind_day_of_month,
  remind_day_of_week,
  remind_time,
  locked,
  onCadence,
  onRemindDate,
  onDayOfMonth,
  onDayOfWeek,
  onTime,
}: {
  cadence: MapCadence;
  remind_date: string | null;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  locked: boolean;
  onCadence: (c: MapCadence) => void;
  onRemindDate: (d: string) => void;
  onDayOfMonth: (d: number) => void;
  onDayOfWeek: (d: string) => void;
  onTime: (t: string) => void;
}) {
  const timeValue = remind_time ?? "09:00";
  const dayOfMonth = Math.min(31, Math.max(1, remind_day_of_month ?? 1));

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-0.5">
      <select
        disabled={locked}
        value={cadence}
        onChange={(e) => onCadence(e.target.value as MapCadence)}
        className={cn(PILL_SELECT, "w-[62px] capitalize")}
      >
        {CADENCE_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>
      <div
        className={cn(
          "shrink-0",
          cadence === "daily"
            ? "w-0 overflow-hidden"
            : cadence === "once"
              ? "w-[96px] max-md:w-[5.25rem]"
              : "w-[40px]",
        )}
      >
        {cadence === "once" ? (
          <input
            type="date"
            disabled={locked}
            value={remind_date ?? ""}
            onChange={(e) => onRemindDate(e.target.value)}
            className={cn(
              PILL_SELECT,
              "w-full max-md:h-6 max-md:min-h-6 max-md:max-h-6 max-md:px-0.5 max-md:leading-none",
              "[&::-webkit-datetime-edit-fields-wrapper]:p-0",
              "[&::-webkit-datetime-edit]:p-0",
              "[&::-webkit-datetime-edit-text]:px-0",
              "[&::-webkit-datetime-edit-month-field]:min-w-0 [&::-webkit-datetime-edit-month-field]:px-0",
              "[&::-webkit-datetime-edit-day-field]:min-w-0 [&::-webkit-datetime-edit-day-field]:px-0",
              "[&::-webkit-datetime-edit-year-field]:min-w-0 [&::-webkit-datetime-edit-year-field]:px-0",
              "[&::-webkit-calendar-picker-indicator]:hidden",
            )}
          />
        ) : cadence === "monthly" ? (
          <input
            type="number"
            min={1}
            max={31}
            disabled={locked}
            value={dayOfMonth}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (Number.isFinite(parsed)) onDayOfMonth(Math.min(31, Math.max(1, parsed)));
            }}
            className={cn(PILL_SELECT, "w-full text-center tabular-nums")}
            aria-label="Day of month"
          />
        ) : cadence === "weekly" ? (
          <select
            disabled={locked}
            value={remind_day_of_week ?? "monday"}
            onChange={(e) => onDayOfWeek(e.target.value)}
            className={cn(PILL_SELECT, "w-full capitalize")}
          >
            {WEEKDAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d.slice(0, 3)}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <input
        type="time"
        disabled={locked}
        value={timeValue}
        onChange={(e) => onTime(e.target.value || "09:00")}
        className={cn(PILL_SELECT, "w-[5.25rem] min-w-[5.25rem] px-1.5 text-center max-md:w-[4.5rem] max-md:min-w-[4.5rem] [&::-webkit-calendar-picker-indicator]:hidden")}
        aria-label="Reminder time"
      />
    </div>
  );
}

function PlanNodeRow({
  title,
  placeholder,
  status,
  locked,
  onTitle,
  onAddAction,
  onReject,
  onDelete,
  className,
}: {
  title: string;
  placeholder: string;
  status: string;
  locked: boolean;
  onTitle: (v: string) => void;
  onAddAction?: () => void;
  onReject: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[40px] w-full flex-nowrap items-center gap-1 rounded-xl border bg-white/95 py-1 pl-2.5 pr-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        suggestedBorder(status),
        className,
      )}
      data-map-node
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <Input
          value={title}
          disabled={locked}
          onChange={(e) => onTitle(stripChromeFromInput(e.target.value))}
          onBlur={(e) => {
            const cleaned = naturalizeTitle(e.target.value);
            if (cleaned !== e.target.value) onTitle(cleaned);
          }}
          className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-medium text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0 max-md:min-w-[80px]"
          placeholder={placeholder}
        />
        {!locked && onAddAction ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddAction();
            }}
            className="shrink-0 rounded-full border border-dashed border-neutral-300 bg-white/70 px-2.5 py-1 text-[10px] text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 max-md:px-2 max-md:py-0.5"
          >
            <Plus className="mr-1 inline h-3 w-3" />
            Add action
          </button>
        ) : null}
      </div>
      <div className={DELETE_SLOT_CLASS}>
        <RejectOrDeleteButton
          suggested={status === "suggested"}
          locked={locked}
          onReject={onReject}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function ActionNodeRow({
  action,
  locked,
  smsReady,
  hasPro,
  onRequestSmsSetup,
  onPatch,
  onReject,
  onDelete,
}: {
  action: AccountabilityAction;
  locked: boolean;
  smsReady: boolean;
  hasPro: boolean;
  onRequestSmsSetup?: (actionId: string) => void;
  onPatch: (patch: Partial<AccountabilityAction>) => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const smsLen = stripSmsText(action.sms_text ?? smsTextFromTitle(action.title)).length;
  const smsOver = smsLen > SMS_MAX_LENGTH;

  const reminderType = primaryReminderType(action.channels);

  const onReminderTypeChange = (type: ReminderType) => {
    if (type === "sms") {
      if (!hasPro) return;
      if (!smsReady) {
        onRequestSmsSetup?.(action.id);
        return;
      }
    }
    const channels = reminderTypeToChannels(type);
    const patch: Partial<AccountabilityAction> = {
      channels,
      reminder_type: type,
    };
    if (type === "sms" && !action.sms_text) {
      patch.sms_text = smsTextFromTitle(action.title);
    }
    if (type !== "sms") {
      patch.sms_text = null;
    }
    onPatch(patch);
  };

  const cardFace = cn(
    "rounded-xl border bg-white/95 py-1 pl-2.5 pr-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
    suggestedBorder(action.status),
  );

  const reminderSettingsLink = (
    <button
      type="button"
      className="shrink-0 text-[10px] font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline max-md:text-[9px]"
      onClick={(e) => {
        e.stopPropagation();
        setFlipped(true);
      }}
    >
      <span className="max-md:hidden">Reminder settings</span>
      <span className="md:hidden">Reminders</span>
    </button>
  );

  const backLink = (
    <button
      type="button"
      className="shrink-0 text-[10px] font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline max-md:text-[9px]"
      onClick={(e) => {
        e.stopPropagation();
        setFlipped(false);
      }}
    >
      Action
    </button>
  );

  const cardFaceLayout = "flex min-h-[40px] w-full max-w-full flex-nowrap items-center gap-1";

  return (
    <div className="w-full max-w-full space-y-1" data-map-node>
      <div className="relative w-full max-w-full">
        <div className="invisible pointer-events-none" aria-hidden>
          <div className={cn(cardFace, cardFaceLayout)}>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <div className="h-8 min-w-0 flex-1 px-1 text-sm font-medium">&nbsp;</div>
              {!locked ? <span className="shrink-0 text-[10px]">Reminder settings</span> : null}
            </div>
            <div className={DELETE_SLOT_CLASS}>
              <div className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0">
          <div
            className={cn(
              cardFace,
              cardFaceLayout,
              "absolute inset-0 transition-opacity duration-150 ease-out",
              flipped ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <Input
                  value={action.title}
                  disabled={locked}
                  onChange={(e) => onPatch({ title: stripChromeFromInput(e.target.value) })}
                  onBlur={(e) => {
                    const cleaned = naturalizeTitle(e.target.value);
                    if (cleaned !== e.target.value) onPatch({ title: cleaned });
                  }}
                  className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-medium text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0"
                  placeholder="Action"
                />
                {!locked ? reminderSettingsLink : null}
              </div>
              <div className={DELETE_SLOT_CLASS}>
                <RejectOrDeleteButton
                  suggested={action.status === "suggested"}
                  locked={locked}
                  onReject={onReject}
                  onDelete={onDelete}
                />
              </div>
            </div>

            <div
              className={cn(
                cardFace,
                cardFaceLayout,
                "absolute inset-0 transition-opacity duration-150 ease-out",
                flipped ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <div className="flex min-w-0 flex-1 touch-pan-x items-center gap-1 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <select
                    disabled={locked}
                    value={reminderType}
                    onChange={(e) => onReminderTypeChange(e.target.value as ReminderType)}
                    className={cn(PILL_SELECT, "w-[82px] max-md:w-[72px]")}
                    title="Reminder type"
                  >
                    <option value="email">Email</option>
                    <option value="calendar">Calendar</option>
                    <option value="sms" disabled={!hasPro}>
                      Text
                    </option>
                  </select>
                  <CadenceTimingControls
                    cadence={action.cadence}
                    remind_date={action.remind_date}
                    remind_day_of_month={action.remind_day_of_month}
                    remind_day_of_week={action.remind_day_of_week}
                    remind_time={action.remind_time}
                    locked={locked}
                    onCadence={(c) => onPatch({ cadence: c, ...applyCadenceFields(c) })}
                    onRemindDate={(d) => onPatch({ remind_date: d })}
                    onDayOfMonth={(d) => onPatch({ remind_day_of_month: d })}
                    onDayOfWeek={(d) => onPatch({ remind_day_of_week: d })}
                    onTime={(t) => onPatch({ remind_time: t })}
                  />
                </div>
                {!locked ? backLink : null}
              </div>
              <div className={DELETE_SLOT_CLASS}>
                <RejectOrDeleteButton
                  suggested={action.status === "suggested"}
                  locked={locked}
                  onReject={onReject}
                  onDelete={onDelete}
                />
              </div>
            </div>
        </div>
      </div>
      {action.channels.sms && !locked ? (
        <div className="flex w-full max-w-full items-center gap-2 px-1">
          <Input
            value={action.sms_text ?? smsTextFromTitle(action.title)}
            onChange={(e) =>
              onPatch({ sms_text: stripSmsText(e.target.value).slice(0, SMS_MAX_LENGTH) })
            }
            className="h-7 min-w-0 flex-1 rounded-lg border-0 bg-neutral-100 px-2 text-[10px] shadow-none focus-visible:ring-1 focus-visible:ring-neutral-300"
            maxLength={SMS_MAX_LENGTH}
            placeholder="Text message"
            aria-label="Text reminder"
          />
          <span className={cn("shrink-0 text-[10px]", smsOver ? "text-destructive" : "text-neutral-400")}>
            {smsLen}/{SMS_MAX_LENGTH}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function applyCadenceFields(cadence: MapCadence): Pick<
  AccountabilityAction,
  "remind_day_of_month" | "remind_day_of_week" | "remind_date"
> {
  if (cadence === "monthly") return { remind_day_of_month: 1, remind_day_of_week: null, remind_date: null };
  if (cadence === "weekly") return { remind_day_of_month: null, remind_day_of_week: "monday", remind_date: null };
  if (cadence === "once") {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return { remind_day_of_month: null, remind_day_of_week: null, remind_date: d.toISOString().slice(0, 10) };
  }
  return { remind_day_of_month: null, remind_day_of_week: null, remind_date: null };
}

function RejectOrDeleteButton({
  suggested,
  locked,
  onReject,
  onDelete,
}: {
  suggested: boolean;
  locked: boolean;
  onReject: () => void;
  onDelete: () => void;
}) {
  if (locked) return null;
  return (
    <button
      type="button"
      className="shrink-0 text-neutral-400 hover:text-neutral-900"
      title={suggested ? "Reject" : "Delete"}
      onClick={suggested ? onReject : onDelete}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

export function BoardAccountabilityFlow({
  map,
  boards,
  onChange,
  smsReady = false,
  hasPro = false,
  onRequestSmsSetup,
  compact = false,
}: BoardAccountabilityFlowProps) {
  const boardById = new Map(boards.map((b) => [b.id, b]));
  const viewportRef = useRef<HTMLDivElement>(null);
  const panDrag = useRef<{ sx: number; sy: number; sl: number; st: number } | null>(null);

  const isInteractiveTarget = (target: EventTarget | null) =>
    !!(target as Element)?.closest?.(
      "[data-map-node], input, button, select, textarea, a, [role='button']",
    );

  const onPanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || isInteractiveTarget(e.target)) return;
    const el = viewportRef.current;
    if (!el) return;
    panDrag.current = { sx: e.clientX, sy: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
    el.setPointerCapture(e.pointerId);
    el.classList.add("cursor-grabbing");
    el.classList.remove("cursor-grab");
  };

  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panDrag.current || !viewportRef.current) return;
    const dx = e.clientX - panDrag.current.sx;
    const dy = e.clientY - panDrag.current.sy;
    viewportRef.current.scrollLeft = panDrag.current.sl - dx;
    viewportRef.current.scrollTop = panDrag.current.st - dy;
  };

  const onPanEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panDrag.current) return;
    panDrag.current = null;
    const el = viewportRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    el?.classList.remove("cursor-grabbing");
    el?.classList.add("cursor-grab");
  };

  const locked = false;

  const patch = (next: AccountabilityMap) => {
    const withEdited = { ...next, edited_at: new Date().toISOString() };
    if (map?.finalized) {
      onChange({ ...withEdited, finalized: false, reminders: [], analysis_status: "draft_ready" });
    } else {
      onChange(withEdited);
    }
  };

  const updatePlan = (id: string, patchPlan: Partial<AccountabilityPlan>) => {
    if (!map) return;
    patch({
      ...map,
      plans: map.plans.map((p) => (p.id === id ? { ...p, ...patchPlan } : p)),
    });
  };

  const rejectPlan = (id: string) => {
    if (!map) return;
    patch({
      ...map,
      plans: map.plans.map((p) => (p.id === id ? { ...p, status: "rejected" } : p)),
    });
  };

  const deletePlan = (id: string) => {
    if (!map) return;
    patch({
      ...map,
      plans: map.plans.filter((p) => p.id !== id),
      actions: map.actions.filter((a) => a.plan_id !== id),
    });
  };

  const addPlan = (focusId: string) => {
    if (!map) return;
    const plan: AccountabilityPlan = {
      id: newId("plan"),
      focus_id: focusId,
      title: "",
      cadence: "monthly",
      remind_day_of_month: null,
      remind_day_of_week: null,
      remind_time: null,
      status: "accepted",
    };
    patch({ ...map, plans: [...map.plans, plan] });
  };

  const updateAction = (id: string, patchAction: Partial<AccountabilityAction>) => {
    if (!map) return;
    patch({
      ...map,
      actions: map.actions.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, ...patchAction };
        if (patchAction.channels || patchAction.reminder_type) {
          const channels = normalizeReminderChannels(
            patchAction.reminder_type
              ? { reminder_type: patchAction.reminder_type }
              : patchAction.channels ?? a.channels,
          );
          next.channels = channels;
          next.reminder_type = reminderTypeFromChannels(channels);
        }
        return next;
      }),
    });
  };

  const rejectAction = (id: string) => {
    if (!map) return;
    patch({
      ...map,
      actions: map.actions.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)),
    });
  };

  const deleteAction = (id: string) => {
    if (!map) return;
    patch({ ...map, actions: map.actions.filter((a) => a.id !== id) });
  };

  const addAction = (planId: string) => {
    if (!map) return;
    const action: AccountabilityAction = {
      id: newId("action"),
      plan_id: planId,
      title: "",
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
    patch({ ...map, actions: [...map.actions, action] });
  };

  const applyCadence = (cadence: MapCadence): Pick<AccountabilityPlan, "remind_day_of_month" | "remind_day_of_week"> => {
    if (cadence === "monthly") return { remind_day_of_month: 1, remind_day_of_week: null };
    if (cadence === "weekly") return { remind_day_of_month: null, remind_day_of_week: "monday" };
    return { remind_day_of_month: null, remind_day_of_week: null };
  };

  const emptyMap = !map?.focuses?.length;

  return (
    <main
      ref={viewportRef}
      className={cn(
        "min-h-0 min-w-0 flex-1 overscroll-contain",
        emptyMap && !compact ? "flex overflow-hidden" : compact && emptyMap ? "overflow-hidden" : "cursor-grab overflow-auto touch-pan-x touch-pan-y",
      )}
      onPointerDown={onPanStart}
      onPointerMove={onPanMove}
      onPointerUp={onPanEnd}
      onPointerCancel={onPanEnd}
      onPointerLeave={onPanEnd}
    >
      <div
        className={cn(
          emptyMap && !compact
            ? "flex h-full w-full min-w-0 items-center justify-center p-12"
            : compact && emptyMap
              ? "flex h-full w-full min-w-0 flex-col p-4"
              : compact
                ? "inline-block min-w-[1100px] p-4"
                : "inline-block min-w-[1100px] p-12",
        )}
      >
        {emptyMap ? (
          <div
            className={cn(
              "flex w-full flex-col",
              compact
                ? "min-h-0 flex-1 items-start justify-start text-left"
                : "max-w-lg items-center px-6 text-center",
            )}
          >
            <h2 className={cn("font-semibold text-neutral-900", compact ? "text-base" : "text-lg")}>
              Turn your workspace into an action map
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Analyze your Vision workspace to draft focus areas, plans, actions and reminders. Edit anytime;
              tap Update to refresh email, text, and calendar reminders.
            </p>
            <p className="mt-3 text-xs text-neutral-500">Nothing is sent until you review and finalize.</p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "mb-6 grid gap-8 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500",
                MAP_GRID,
              )}
            >
              <span>Focus</span>
              <span>Plan</span>
              <span className="pl-6">Action</span>
            </div>

            <div className="space-y-6">
              {map.focuses.map((focus) => {
                const board = boardById.get(focus.board_id);
                const headerFill = board ? boardFillForKey(board.color_key) : "#f5f5f5";
                const plansForFocus = visible(map.plans.filter((p) => p.focus_id === focus.id));

                return (
                  <section key={focus.id} className={cn("relative grid items-start gap-8", MAP_GRID)}>
                    <div className="relative">
                      <div
                        className="relative min-h-[92px] rounded-2xl border border-black/5 px-4 py-3 shadow-sm"
                        style={{ backgroundColor: headerFill }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Focus</p>
                        <p className="mt-2 line-clamp-2 text-base font-semibold text-neutral-950">{focus.title}</p>
                        {!locked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addPlan(focus.id);
                            }}
                            className="mt-3 rounded-full border border-black/10 bg-white/55 px-2.5 py-1 text-[10px] font-medium text-neutral-700 hover:bg-white/75"
                          >
                            <Plus className="mr-1 inline h-3 w-3" />
                            Add plan
                          </button>
                        ) : null}
                      </div>
                      {plansForFocus.length > 0 ? (
                        <div className="pointer-events-none absolute right-0 top-1/2 h-px w-8 translate-x-full bg-neutral-300" />
                      ) : null}
                    </div>

                    <div className="col-span-2 relative">
                      {plansForFocus.length > 0 ? (
                        <div className="pointer-events-none absolute bottom-5 left-0 top-5 w-px bg-neutral-300" />
                      ) : null}
                      <div className="space-y-3 pl-6">
                      {plansForFocus.length === 0 ? null : plansForFocus.map((plan) => {
                        const actionsForPlan = visible(map.actions.filter((a) => a.plan_id === plan.id));
                        return (
                          <div
                            key={plan.id}
                            className={cn("grid items-start", PLAN_ACTION_GRID)}
                          >
                            <div className="relative">
                              <div className="pointer-events-none absolute left-[-24px] top-5 h-px w-6 bg-neutral-300" />
                              <PlanNodeRow
                                title={plan.title}
                                placeholder="Plan name"
                                status={plan.status}
                                locked={locked}
                                onTitle={(v) => updatePlan(plan.id, { title: v })}
                                onAddAction={() => addAction(plan.id)}
                                onReject={() => rejectPlan(plan.id)}
                                onDelete={() => deletePlan(plan.id)}
                              />
                            </div>
                            <div className="relative min-h-[40px]">
                              {actionsForPlan.length > 0 ? (
                                <div className="pointer-events-none absolute left-0 right-0 top-5 h-px bg-neutral-300" />
                              ) : null}
                            </div>
                            <div className="relative pl-6">
                              {actionsForPlan.length > 0 ? (
                                <div className="pointer-events-none absolute bottom-5 left-0 top-5 w-px bg-neutral-300" />
                              ) : null}
                              <div className="flex flex-col items-start gap-3">
                                {actionsForPlan.map((action) => (
                                  <div key={action.id} className="relative w-full">
                                    <div className="pointer-events-none absolute left-[-24px] top-5 h-px w-6 bg-neutral-300" />
                                    <ActionNodeRow
                                      action={action}
                                      locked={locked}
                                      smsReady={smsReady}
                                      hasPro={hasPro}
                                      onRequestSmsSetup={onRequestSmsSetup}
                                      onPatch={(patchAction) => updateAction(action.id, patchAction)}
                                      onReject={() => rejectAction(action.id)}
                                      onDelete={() => deleteAction(action.id)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
