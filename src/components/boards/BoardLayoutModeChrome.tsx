import type { BoardLayoutMode } from "@/lib/boards/types";
import { cn } from "@/lib/utils";

type BoardLayoutModeChromeProps = {
  mode: BoardLayoutMode;
  embedded?: boolean;
};

const KANBAN_COLS = ["Backlog", "To Do", "Doing", "Done"];
const FIVE_S = ["Sort", "Set in Order", "Shine", "Standardize", "Sustain"];
const EISENHOWER = [
  { title: "Do First", sub: "Urgent + Important" },
  { title: "Schedule", sub: "Important, not urgent" },
  { title: "Delegate", sub: "Urgent, not important" },
  { title: "Eliminate", sub: "Neither" },
];

export function BoardLayoutModeChrome({ mode, embedded }: BoardLayoutModeChromeProps) {
  if (mode === "vision") return null;

  const pad = embedded ? "p-1.5" : "p-3";
  const text = embedded ? "text-[8px]" : "text-[10px]";
  const head = embedded ? "text-[9px]" : "text-xs";

  if (mode === "kanban") {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 z-[2] flex gap-1", pad)}
        aria-hidden
      >
        {KANBAN_COLS.map((col) => (
          <div key={col} className="flex min-w-0 flex-1 flex-col rounded-md bg-white/75 ring-1 ring-neutral-200/90">
            <div className={cn("border-b border-neutral-200/80 px-1.5 py-1 font-semibold text-neutral-800", head)}>
              {col}
            </div>
            <div className="flex-1 space-y-1 p-1">
              <div className={cn("rounded bg-neutral-100/90 px-1 py-2 text-neutral-500", text)}>+ card</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "eisenhower") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 z-[2] grid grid-cols-2 grid-rows-2 gap-1", pad)} aria-hidden>
        {EISENHOWER.map((q) => (
          <div key={q.title} className="rounded-md bg-white/75 p-1.5 ring-1 ring-neutral-200/90">
            <p className={cn("font-semibold text-neutral-900", head)}>{q.title}</p>
            <p className={cn("text-neutral-500", text)}>{q.sub}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "five_s") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 z-[2] flex flex-col gap-1", pad)} aria-hidden>
        {FIVE_S.map((step, i) => (
          <div
            key={step}
            className="flex flex-1 items-center gap-2 rounded-md bg-white/75 px-2 ring-1 ring-neutral-200/90"
          >
            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 font-bold text-white", text)}>
              {i + 1}
            </span>
            <span className={cn("font-medium text-neutral-800", head)}>{step}</span>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "gantt") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 z-[2] flex flex-col", pad)} aria-hidden>
        <div className={cn("mb-1 font-semibold text-neutral-700", head)}>Timeline</div>
        <div className="flex flex-1 flex-col justify-center gap-2">
          {["Phase 1", "Phase 2", "Milestone"].map((row, i) => (
            <div key={row} className="flex items-center gap-2">
              <span className={cn("w-14 shrink-0 text-neutral-600", text)}>{row}</span>
              <div
                className="h-3 rounded-full bg-blue-400/70"
                style={{ width: `${55 - i * 12}%`, marginLeft: `${i * 8}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "okrs") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 z-[2] space-y-2", pad)} aria-hidden>
        <div className="rounded-md bg-white/80 p-2 ring-1 ring-neutral-200/90">
          <p className={cn("font-semibold text-neutral-900", head)}>Objective</p>
          <p className={cn("text-neutral-500", text)}>What we want to achieve this quarter</p>
        </div>
        {["KR 1", "KR 2", "KR 3"].map((kr) => (
          <div key={kr} className="rounded-md bg-white/75 px-2 py-1.5 ring-1 ring-neutral-200/80">
            <div className="flex items-center justify-between">
              <span className={cn("font-medium text-neutral-800", text)}>{kr}</span>
              <span className={cn("text-neutral-400", text)}>0%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-neutral-200">
              <div className="h-full w-1/4 rounded-full bg-emerald-500/80" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "checklist") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 z-[2] space-y-1.5", pad)} aria-hidden>
        {["Morning reset", "Afternoon block", "Evening close-out"].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-md bg-white/80 px-2 py-1.5 ring-1 ring-neutral-200/80">
            <span className="h-3 w-3 shrink-0 rounded border border-neutral-400" />
            <span className={cn("text-neutral-800", text)}>{item}</span>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "gallery") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 z-[2] grid grid-cols-3 gap-1", pad)} aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-md bg-white/70 ring-1 ring-neutral-200/80" />
        ))}
      </div>
    );
  }

  return null;
}
