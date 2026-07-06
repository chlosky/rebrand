import { useEffect, useState } from "react";
import { ImagePlus, Palette, StickyNote, Trash2, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BoardMarksQuickAction =
  | "statement"
  | "sticky"
  | "image"
  | "edit"
  | "color"
  | "delete";

type BoardMarksQuickSelectorProps = {
  x: number;
  y: number;
  mode: "empty" | "object";
  onPick: (action: BoardMarksQuickAction) => void;
  onClose: () => void;
  boardColorOptions?: { hex: string; label: string }[];
  activeBoardFill?: string;
  onBoardColorPick?: (hex: string) => void;
  onElementColorPick?: (hex: string) => void;
};

const WHEEL = 176;
const CENTER = WHEEL / 2;
const ITEM_RADIUS = 54;
const SWATCH_RADIUS = 74;

const EMPTY_ITEMS: { id: BoardMarksQuickAction; label: string; Icon: LucideIcon; angle: number }[] = [
  { id: "statement", label: "Text", Icon: Type, angle: -90 },
  { id: "image", label: "Image", Icon: ImagePlus, angle: 0 },
  { id: "sticky", label: "Note", Icon: StickyNote, angle: 90 },
  { id: "color", label: "Recolor", Icon: Palette, angle: 180 },
];

const OBJECT_ITEMS: {
  id: BoardMarksQuickAction;
  label: string;
  Icon: LucideIcon;
  angle: number;
  accent?: string;
}[] = [
  { id: "edit", label: "Edit", Icon: Type, angle: -90 },
  { id: "color", label: "Recolor", Icon: Palette, angle: 30 },
  { id: "delete", label: "Delete", Icon: Trash2, angle: 150, accent: "text-red-300" },
];

export function BoardMarksQuickSelector({
  x,
  y,
  mode,
  onPick,
  onClose,
  boardColorOptions = [],
  activeBoardFill,
  onBoardColorPick,
  onElementColorPick,
}: BoardMarksQuickSelectorProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const items = mode === "object" ? OBJECT_ITEMS : EMPTY_ITEMS;
  const paletteLabel = mode === "empty" ? "Board color" : "Element color";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (paletteOpen) setPaletteOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onClose, paletteOpen]);

  const handleBackdropClick = () => {
    if (paletteOpen) setPaletteOpen(false);
    else onClose();
  };

  const handleItemClick = (id: BoardMarksQuickAction) => {
    if (id === "color") {
      setPaletteOpen(true);
      return;
    }
    onPick(id);
  };

  const handleColorPick = (hex: string) => {
    if (mode === "empty") onBoardColorPick?.(hex);
    else onElementColorPick?.(hex);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close marks selector"
        className="absolute inset-0 z-30 cursor-default bg-black/10 backdrop-blur-[1px]"
        onClick={handleBackdropClick}
      />
      <div
        className="board-marks-quick-selector pointer-events-none absolute z-40"
        style={{ left: x, top: y }}
        role="menu"
        aria-label="Marks quick selector"
      >
        <div
          className="pointer-events-auto relative -translate-x-1/2 -translate-y-1/2"
          style={{ width: WHEEL, height: WHEEL }}
        >
          <div className="absolute inset-0 rounded-full border border-white/10 bg-neutral-950/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-md" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />

          {paletteOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-3 text-center text-[10px] font-medium leading-tight text-white/70">
              {paletteLabel}
            </span>
          )}

          {!paletteOpen &&
            items.map(({ id, label, Icon, angle, accent }) => {
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * ITEM_RADIUS;
              const top = CENTER + Math.sin(rad) * ITEM_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  title={label}
                  onClick={() => handleItemClick(id)}
                  className={cn(
                    "absolute flex min-w-[3.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 py-1.5 text-white transition-all",
                    "hover:scale-105 hover:border-white/30 hover:bg-white/20 active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    accent,
                  )}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="text-[11px] font-bold leading-none tracking-wide text-white">{label}</span>
                </button>
              );
            })}

          {paletteOpen && boardColorOptions.length > 0 && (
            <>
              {boardColorOptions.slice(0, 8).map((pick, index) => {
                const start = 205;
                const step = 130 / Math.max(boardColorOptions.slice(0, 8).length - 1, 1);
                const angle = start + index * step;
                const rad = (angle * Math.PI) / 180;
                const left = CENTER + Math.cos(rad) * SWATCH_RADIUS;
                const top = CENTER + Math.sin(rad) * SWATCH_RADIUS;
                const active =
                  mode === "empty" && activeBoardFill?.toLowerCase() === pick.hex.toLowerCase();

                return (
                  <button
                    key={pick.hex}
                    type="button"
                    title={`${paletteLabel}: ${pick.label}`}
                    aria-label={`Set ${paletteLabel.toLowerCase()} to ${pick.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorPick(pick.hex);
                    }}
                    className={cn(
                      "absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/50 transition-transform",
                      "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      active && "scale-110 ring-2 ring-white",
                    )}
                    style={{ left, top, backgroundColor: pick.hex }}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}
