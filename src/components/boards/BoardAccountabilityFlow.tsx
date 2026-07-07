import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type {
  AccountabilityAction,
  AccountabilityMap,
  AccountabilityPlan,
  MapCadence,
} from "@/lib/boards/accountabilityMap";
import {
  CADENCE_OPTIONS,
  DAILY_TIME_QUICK_OPTIONS,
  naturalizeTitle,
  stripChromeFromInput,
  WEEKDAY_OPTIONS,
} from "@/lib/boards/accountabilityMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BoardAccountabilityFlowProps = {
  map: AccountabilityMap | null;
  boards: Board[];
  onChange: (map: AccountabilityMap) => void;
};

const MAP_GRID = "grid-cols-[240px_minmax(220px,280px)_minmax(460px,1fr)]";

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
  "h-7 shrink-0 rounded-lg border-0 bg-neutral-100 px-2 text-[11px] text-neutral-700 outline-none focus:ring-1 focus:ring-neutral-300";

function CadenceTimingControls({
  cadence,
  remind_day_of_month,
  remind_day_of_week,
  remind_time,
  locked,
  onCadence,
  onDayOfMonth,
  onDayOfWeek,
  onTime,
}: {
  cadence: MapCadence;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  locked: boolean;
  onCadence: (c: MapCadence) => void;
  onDayOfMonth: (d: number) => void;
  onDayOfWeek: (d: string) => void;
  onTime: (t: string) => void;
}) {
  const timeValue = remind_time ?? "09:00";
  const timeOptions: readonly string[] =
    (DAILY_TIME_QUICK_OPTIONS as readonly string[]).includes(timeValue)
      ? DAILY_TIME_QUICK_OPTIONS
      : [...DAILY_TIME_QUICK_OPTIONS, timeValue];

  const timeLabel = (t: string) => {
    const [h, m] = t.split(":").map((x) => parseInt(x, 10));
    const hour = Number.isFinite(h) ? h : 9;
    const min = Number.isFinite(m) ? m : 0;
    const period = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${String(min).padStart(2, "0")} ${period}`;
  };

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1">
      <select
        disabled={locked}
        value={cadence}
        onChange={(e) => onCadence(e.target.value as MapCadence)}
        className={cn(PILL_SELECT, "w-[76px] capitalize")}
      >
        {CADENCE_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>
      <div className="w-[80px] shrink-0">
        {cadence === "monthly" ? (
          <select
            disabled={locked}
            value={remind_day_of_month === -1 ? "last" : String(remind_day_of_month ?? 1)}
            onChange={(e) => onDayOfMonth(e.target.value === "last" ? -1 : parseInt(e.target.value, 10))}
            className={cn(PILL_SELECT, "w-full")}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
            <option value="last">Last</option>
          </select>
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
      <select
        disabled={locked}
        value={timeValue}
        onChange={(e) => onTime(e.target.value)}
        className={cn(PILL_SELECT, "w-[96px]")}
      >
        {timeOptions.map((t) => (
          <option key={t} value={t}>
            {timeLabel(t)}
          </option>
        ))}
      </select>
    </div>
  );
}

function PlanNodeRow({
  title,
  placeholder,
  status,
  locked,
  onTitle,
  onReject,
  onDelete,
  className,
}: {
  title: string;
  placeholder: string;
  status: string;
  locked: boolean;
  onTitle: (v: string) => void;
  onReject: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[40px] w-full items-center gap-1.5 rounded-xl border bg-white/95 py-1 pl-2.5 pr-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        suggestedBorder(status),
        className,
      )}
      data-map-node
    >
      <Input
        value={title}
        disabled={locked}
        onChange={(e) => onTitle(stripChromeFromInput(e.target.value))}
        onBlur={(e) => {
          const cleaned = naturalizeTitle(e.target.value);
          if (cleaned !== e.target.value) onTitle(cleaned);
        }}
        className="h-8 min-w-[120px] flex-1 border-0 bg-transparent px-1 text-sm font-medium text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0"
        placeholder={placeholder}
      />
      <RejectOrDeleteButton
        suggested={status === "suggested"}
        locked={locked}
        onReject={onReject}
        onDelete={onDelete}
      />
    </div>
  );
}

function ActionNodeRow({
  title,
  placeholder,
  status,
  locked,
  cadence,
  remind_day_of_month,
  remind_day_of_week,
  remind_time,
  onTitle,
  onCadence,
  onDayOfMonth,
  onDayOfWeek,
  onTime,
  onReject,
  onDelete,
  className,
}: {
  title: string;
  placeholder: string;
  status: string;
  locked: boolean;
  cadence: MapCadence;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  onTitle: (v: string) => void;
  onCadence: (c: MapCadence) => void;
  onDayOfMonth: (d: number) => void;
  onDayOfWeek: (d: string) => void;
  onTime: (t: string) => void;
  onReject: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex min-h-[40px] w-[460px] max-w-full flex-nowrap items-center gap-1.5 rounded-xl border bg-white/95 py-1 pl-2.5 pr-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        suggestedBorder(status),
        className,
      )}
      data-map-node
    >
      <Input
        value={title}
        disabled={locked}
        onChange={(e) => onTitle(stripChromeFromInput(e.target.value))}
        onBlur={(e) => {
          const cleaned = naturalizeTitle(e.target.value);
          if (cleaned !== e.target.value) onTitle(cleaned);
        }}
        className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-medium text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0"
        placeholder={placeholder}
      />
      <CadenceTimingControls
        cadence={cadence}
        remind_day_of_month={remind_day_of_month}
        remind_day_of_week={remind_day_of_week}
        remind_time={remind_time}
        locked={locked}
        onCadence={onCadence}
        onDayOfMonth={onDayOfMonth}
        onDayOfWeek={onDayOfWeek}
        onTime={onTime}
      />
      <RejectOrDeleteButton
        suggested={status === "suggested"}
        locked={locked}
        onReject={onReject}
        onDelete={onDelete}
      />
    </div>
  );
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

export function BoardAccountabilityFlow({ map, boards, onChange }: BoardAccountabilityFlowProps) {
  const boardById = new Map(boards.map((b) => [b.id, b]));
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panPos = useRef({ x: 48, y: 48 });
  const panDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const applyPan = () => {
    if (!canvasRef.current) return;
    canvasRef.current.style.transform = `translate(${panPos.current.x}px, ${panPos.current.y}px)`;
  };

  const isInteractiveTarget = (target: EventTarget | null) =>
    !!(target as Element)?.closest?.(
      "[data-map-node], input, button, select, textarea, a, [role='button']",
    );

  const onPanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isInteractiveTarget(e.target)) return;
    panDrag.current = { sx: e.clientX, sy: e.clientY, ox: panPos.current.x, oy: panPos.current.y };
    viewportRef.current?.setPointerCapture(e.pointerId);
    viewportRef.current?.classList.add("cursor-grabbing");
    viewportRef.current?.classList.remove("cursor-grab");
  };

  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panDrag.current) return;
    panPos.current = {
      x: panDrag.current.ox + e.clientX - panDrag.current.sx,
      y: panDrag.current.oy + e.clientY - panDrag.current.sy,
    };
    applyPan();
  };

  const onPanEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panDrag.current) return;
    panDrag.current = null;
    if (viewportRef.current?.hasPointerCapture(e.pointerId)) {
      viewportRef.current.releasePointerCapture(e.pointerId);
    }
    viewportRef.current?.classList.remove("cursor-grabbing");
    viewportRef.current?.classList.add("cursor-grab");
  };

  const locked = map?.finalized ?? false;

  const patch = (next: AccountabilityMap) => onChange(next);

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
      actions: map.actions.map((a) => (a.id === id ? { ...a, ...patchAction } : a)),
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
      remind_day_of_month: null,
      remind_day_of_week: "monday",
      remind_time: "09:00",
      status: "accepted",
      kind: "action",
    };
    patch({ ...map, actions: [...map.actions, action] });
  };

  const applyCadence = (cadence: MapCadence): Pick<AccountabilityPlan, "remind_day_of_month" | "remind_day_of_week"> => {
    if (cadence === "monthly") return { remind_day_of_month: 1, remind_day_of_week: null };
    if (cadence === "weekly") return { remind_day_of_month: null, remind_day_of_week: "monday" };
    return { remind_day_of_month: null, remind_day_of_week: null };
  };

  return (
    <main
      ref={viewportRef}
      className="min-h-0 min-w-0 flex-1 cursor-grab touch-none overflow-hidden"
      onPointerDown={onPanStart}
      onPointerMove={onPanMove}
      onPointerUp={onPanEnd}
      onPointerCancel={onPanEnd}
      onPointerLeave={onPanEnd}
    >
      <div
        ref={canvasRef}
        className="inline-block min-w-[1180px] select-none p-12"
        style={{ transform: `translate(${panPos.current.x}px, ${panPos.current.y}px)` }}
      >
        {!map?.focuses?.length ? (
          <div className="flex min-h-[280px] items-center justify-center text-center">
            <div>
              <p className="text-sm text-neutral-700">
                Run Analyze to turn your focus boards and The Plan into an action map.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Edit the map, remove what does not fit, add your own actions, then finalize reminders.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "mb-6 grid gap-8 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500",
                MAP_GRID,
              )}
            >
              <span>Focuses</span>
              <span>Plans</span>
              <span>Actions</span>
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
                        className="relative min-h-[72px] rounded-2xl border border-black/5 px-4 py-3 shadow-sm"
                        style={{ backgroundColor: headerFill }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Focus</p>
                        <p className="mt-2 line-clamp-2 text-base font-semibold text-neutral-950">{focus.title}</p>
                      </div>
                      {plansForFocus.length > 0 ? (
                        <div className="pointer-events-none absolute right-0 top-1/2 h-px w-8 translate-x-full bg-neutral-300" />
                      ) : null}
                    </div>

                    <div className="relative space-y-3">
                      {plansForFocus.map((plan) => (
                        <div key={plan.id} className="relative">
                          <PlanNodeRow
                            title={plan.title}
                            placeholder="Plan name"
                            status={plan.status}
                            locked={locked}
                            onTitle={(v) => updatePlan(plan.id, { title: v })}
                            onReject={() => rejectPlan(plan.id)}
                            onDelete={() => deletePlan(plan.id)}
                          />
                          <div className="pointer-events-none absolute right-0 top-1/2 h-px w-8 translate-x-full bg-neutral-300" />
                        </div>
                      ))}
                      {!locked ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full text-[11px]"
                          onClick={() => addPlan(focus.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add plan
                        </Button>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      {plansForFocus.length === 0 ? (
                        <p className="text-xs text-neutral-400">Actions connect to a plan</p>
                      ) : (
                        plansForFocus.map((plan) => {
                          const actionsForPlan = visible(map.actions.filter((a) => a.plan_id === plan.id));
                          return (
                            <div key={plan.id} className="relative pl-6">
                              <div className="pointer-events-none absolute left-0 top-5 h-px w-6 bg-neutral-300" />
                              <div className="flex flex-col items-start gap-2">
                                {actionsForPlan.map((action) => (
                                  <ActionNodeRow
                                    key={action.id}
                                    title={action.title}
                                    placeholder="Action"
                                    status={action.status}
                                    locked={locked}
                                    cadence={action.cadence}
                                    remind_day_of_month={action.remind_day_of_month}
                                    remind_day_of_week={action.remind_day_of_week}
                                    remind_time={action.remind_time}
                                    onTitle={(v) => updateAction(action.id, { title: v })}
                                    onCadence={(c) =>
                                      updateAction(action.id, { cadence: c, ...applyCadence(c) })
                                    }
                                    onDayOfMonth={(d) => updateAction(action.id, { remind_day_of_month: d })}
                                    onDayOfWeek={(d) => updateAction(action.id, { remind_day_of_week: d })}
                                    onTime={(t) => updateAction(action.id, { remind_time: t })}
                                    onReject={() => rejectAction(action.id)}
                                    onDelete={() => deleteAction(action.id)}
                                  />
                                ))}
                                {!locked ? (
                                  <button
                                    type="button"
                                    onClick={() => addAction(plan.id)}
                                    className="flex h-9 items-center gap-1 rounded-full border border-dashed border-neutral-300 bg-white/70 px-3 text-[11px] text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add action
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      )}
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
