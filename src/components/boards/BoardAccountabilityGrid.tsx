import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { AccountabilityGoal } from "@/lib/boards/accountabilityMap";
import { cn } from "@/lib/utils";

const GRID_GAP_PX = 10;
const GRID_PAD_PX = 8;
const TITLE_BAR_PX = 32;
const MIN_CELL_WIDTH_PX = 200;
const CELL_HEIGHT = 420;

type BoardAccountabilityGridProps = {
  goals: AccountabilityGoal[];
  boards: Board[];
  activeId: string | null;
  onSelect: (goalId: string) => void;
};

function GoalTree({ goal }: { goal: AccountabilityGoal }) {
  return (
    <div className="space-y-3 p-3 text-[11px] leading-snug text-neutral-800">
      <p className="text-[10px] text-neutral-500">{goal.rationale}</p>
      {goal.quarterly.map((q, qi) => (
        <div key={qi} className="border-l-2 border-amber-700/40 pl-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-amber-900">Quarterly</p>
          <p className="font-semibold text-neutral-900">{q.title}</p>
          {q.monthly.map((m, mi) => (
            <div key={mi} className="mt-2 border-l border-neutral-300 pl-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Monthly</p>
              <p className="font-medium">{m.title}</p>
              {m.weekly.map((w, wi) => (
                <div key={wi} className="mt-1.5 border-l border-neutral-200 pl-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">Weekly</p>
                  <p>{w.title}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-neutral-600">
                    {w.daily.map((d, di) => (
                      <li key={di}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function BoardAccountabilityGrid({ goals, boards, activeId, onSelect }: BoardAccountabilityGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState(280);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const boardById = new Map(boards.map((b) => [b.id, b]));

  const updateScrollHints = () => {
    const el = viewportRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useLayoutEffect(() => {
    const grid = gridRef.current;
    const viewport = viewportRef.current;
    if (!grid || !viewport) return;

    const measure = () => {
      const availW = viewport.clientWidth - GRID_PAD_PX * 2;
      const count = Math.max(goals.length, 1);
      const gaps = GRID_GAP_PX * Math.max(count - 1, 0);
      const w = Math.max(MIN_CELL_WIDTH_PX, Math.floor((availW - gaps) / Math.min(count, 4)));
      setCellWidth(w);
    };

    measure();
    const observer = new ResizeObserver(() => {
      measure();
      updateScrollHints();
    });
    observer.observe(grid);
    observer.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [goals.length]);

  useEffect(() => {
    updateScrollHints();
  }, [goals.length, cellWidth]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !activeId) return;
    const el = viewport.querySelector(`[data-goal-id="${activeId}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [activeId, cellWidth]);

  const rowHeight = CELL_HEIGHT + TITLE_BAR_PX;
  const rowScrollWidth = goals.length * cellWidth + Math.max(goals.length - 1, 0) * GRID_GAP_PX;

  const scrollByPage = (direction: -1 | 1) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.6, cellWidth), behavior: "smooth" });
  };

  if (!goals.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-neutral-500">
        Run Analyze to map goals from your boards into a quarterly → monthly → weekly → daily action.
      </div>
    );
  }

  return (
    <div ref={gridRef} className="board-desktop-grid flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll goals left"
            onClick={() => scrollByPage(-1)}
            className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll goals right"
            onClick={() => scrollByPage(1)}
            className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div
          ref={viewportRef}
          className="board-row-scroll flex h-full flex-col overflow-x-auto overflow-y-hidden scroll-smooth p-2"
          onScroll={updateScrollHints}
          onWheel={(e) => {
            const el = viewportRef.current;
            if (!el || el.scrollWidth <= el.clientWidth) return;
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              el.scrollLeft += e.deltaY;
              e.preventDefault();
            }
          }}
        >
          <div
            className="flex min-h-full flex-row flex-nowrap items-stretch gap-2.5"
            style={{ width: rowScrollWidth, minHeight: rowHeight, height: rowHeight }}
          >
            {goals.map((goal) => {
              const board = boardById.get(goal.board_id);
              const active = goal.id === activeId;
              const headerFill = board ? boardFillForKey(board.color_key) : "#f5f5f5";

              return (
                <div
                  key={goal.id}
                  data-goal-id={goal.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(goal.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(goal.id);
                    }
                  }}
                  style={{ width: cellWidth, height: rowHeight }}
                  className={cn(
                    "board-grid-cell flex shrink-0 flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-shadow",
                    active ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  <div
                    className="flex h-8 shrink-0 items-center justify-between gap-1 border-b border-neutral-100 px-2.5"
                    style={{ backgroundColor: headerFill }}
                  >
                    <span className="truncate text-[11px] font-semibold text-neutral-900">{goal.title}</span>
                    {goal.board_role === "plan" ? (
                      <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-neutral-800">
                        Plan
                      </span>
                    ) : null}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto" style={{ height: CELL_HEIGHT }}>
                    <p className="border-b border-neutral-100 px-2.5 py-1.5 text-[10px] text-neutral-500">
                      From {goal.board_title}
                    </p>
                    <GoalTree goal={goal} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
