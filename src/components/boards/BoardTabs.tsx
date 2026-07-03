import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOARD_COLORS, boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";

type BoardTabsProps = {
  boards: Board[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddBoard: () => void;
  canRemove: boolean;
  onRemoveBoard?: () => void;
};

export function BoardTabs({ boards, activeId, onSelect, onAddBoard, canRemove, onRemoveBoard }: BoardTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2">
      {boards.map((b) => {
        const active = b.id === activeId;
        const swatch = BOARD_COLORS[b.color_key as keyof typeof BOARD_COLORS]?.swatch ?? "#E8B4B8";
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect(b.id)}
            className={cn(
              "inline-flex max-w-[11rem] items-center gap-2 truncate rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
            )}
            style={active ? undefined : { backgroundColor: boardFillForKey(b.color_key) }}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: swatch }} />
            <span className="truncate">{b.title}</span>
            {b.role === "plan" && (
              <span className={cn("shrink-0 text-[9px] uppercase", active ? "text-white/80" : "text-neutral-500")}>
                Plan
              </span>
            )}
          </button>
        );
      })}
      <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full text-xs" onClick={onAddBoard}>
        <Plus className="h-3.5 w-3.5" />
        Board
      </Button>
      {canRemove && onRemoveBoard && (
        <Button variant="ghost" size="sm" className="h-8 text-xs text-neutral-500" onClick={onRemoveBoard}>
          Remove board
        </Button>
      )}
    </div>
  );
}
