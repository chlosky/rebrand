import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeBoardColorHex } from "@/lib/boards/colors";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TITLE_FONTS = [
  { id: "system", label: "Sans", family: "system-ui, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "display", label: "Block", family: "'Arial Black', 'Helvetica Neue', sans-serif" },
  { id: "script", label: "Script", family: "'Brush Script MT', 'Segoe Script', cursive" },
] as const;

const TITLE_COLOR_PRESETS = ["#171717", "#ffffff", "#e53935", "#1e88e5", "#43a047", "#8e24aa", "#fb8c00"] as const;

type Hsv = { h: number; s: number; v: number };

function titleColorForFill(fillHex: string): string {
  const hex = fillHex.replace("#", "");
  if (hex.length !== 6) return "#171717";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55 ? "#ffffff" : "#171717";
}

function hexToHsv(hex: string): Hsv {
  const normalized = normalizeBoardColorHex(hex) ?? "#171717";
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toByte = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

type BoardEditableTitleProps = {
  boardId: string;
  title: string;
  headerFill: string;
  titleColor?: string | null;
  titleFont?: string | null;
  onRename: (boardId: string, title: string) => void | Promise<void>;
  onStyleChange: (boardId: string, patch: { title_color?: string | null; title_font?: string | null }) => void | Promise<void>;
  showStyleControls?: boolean;
  className?: string;
  inputClassName?: string;
};

export function BoardEditableTitle({
  boardId,
  title,
  headerFill,
  titleColor,
  titleFont,
  onRename,
  onStyleChange,
  showStyleControls = false,
  className,
  inputClassName,
}: BoardEditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const defaultColor = titleColorForFill(headerFill);
  const savedColor = titleColor ? normalizeBoardColorHex(titleColor) : null;
  const resolvedColor = savedColor ?? defaultColor;

  const [hexDraft, setHexDraft] = useState(resolvedColor);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(resolvedColor));
  const previewColor = normalizeBoardColorHex(hexDraft) ?? resolvedColor;

  const resolvedFont =
    TITLE_FONTS.find((f) => f.id === titleFont)?.family ??
    TITLE_FONTS.find((f) => f.family === titleFont)?.family ??
    TITLE_FONTS[0].family;
  const fontSelectValue =
    TITLE_FONTS.find((f) => f.id === titleFont || f.family === titleFont)?.id ?? "system";

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (draggingRef.current || pickerOpen) return;
    setHexDraft(resolvedColor);
    setHsv(hexToHsv(resolvedColor));
  }, [resolvedColor, pickerOpen]);

  const commitColor = useCallback(
    (raw: string, closePicker = false) => {
      const hex = normalizeBoardColorHex(raw);
      if (!hex) {
        setHexDraft(resolvedColor);
        setHsv(hexToHsv(resolvedColor));
        return;
      }
      setHexDraft(hex);
      setHsv(hexToHsv(hex));
      if (hex !== savedColor) {
        void onStyleChange(boardId, { title_color: hex });
      }
      if (closePicker) setPickerOpen(false);
    },
    [boardId, onStyleChange, resolvedColor, savedColor],
  );

  const applyHsv = useCallback(
    (next: Hsv, commit: boolean) => {
      draggingRef.current = !commit;
      const hex = hsvToHex(next);
      setHsv(next);
      setHexDraft(hex);
      if (commit) {
        draggingRef.current = false;
        commitColor(hex);
      }
    },
    [commitColor],
  );

  const pickSvFromPointer = useCallback(
    (clientX: number, clientY: number, commit: boolean) => {
      const el = svRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      applyHsv({ h: hsv.h, s: x * 100, v: (1 - y) * 100 }, commit);
    },
    [applyHsv, hsv.h],
  );

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setDraft(title);
      return;
    }
    void onRename(boardId, trimmed);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(title);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={80}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ color: previewColor, fontFamily: resolvedFont }}
        className={cn(
          "min-w-0 flex-1 rounded border border-neutral-400 bg-white/90 px-1 py-0 text-inherit outline-none ring-1 ring-neutral-900/10 focus:border-neutral-600",
          inputClassName,
        )}
        aria-label="Board name"
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        style={{ color: previewColor, fontFamily: resolvedFont }}
        className={cn(
          "min-w-0 flex-1 truncate text-left decoration-dotted underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none",
          className,
        )}
        title="Click to rename"
      >
        {title}
      </button>
      {showStyleControls ? (
        <>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Title color"
                aria-label="Title color"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded ring-1 ring-black/10"
              >
                <span
                  className="h-4 w-4 rounded-sm ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: previewColor }}
                  aria-hidden
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-56 p-2.5"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Title color</p>
              <input
                type="text"
                value={hexDraft}
                onChange={(e) => setHexDraft(e.target.value)}
                onBlur={() => commitColor(hexDraft)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitColor(hexDraft, true);
                }}
                spellCheck={false}
                className="mb-2 w-full rounded-md border border-stone-300/80 bg-white px-2 py-1.5 font-mono text-[11px] uppercase text-stone-800"
                aria-label="Title color hex"
              />
              <div
                ref={svRef}
                className="relative mb-2 h-24 w-full cursor-crosshair touch-none overflow-hidden rounded-md"
                style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  pickSvFromPointer(e.clientX, e.clientY, false);
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  pickSvFromPointer(e.clientX, e.clientY, false);
                }}
                onPointerUp={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  pickSvFromPointer(e.clientX, e.clientY, true);
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <div
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                  style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={Math.round(hsv.h)}
                onChange={(e) => applyHsv({ ...hsv, h: Number(e.target.value) }, true)}
                className="mb-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                aria-label="Hue"
              />
              <div className="grid grid-cols-7 gap-1">
                {TITLE_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    onClick={() => commitColor(hex, true)}
                    className={cn(
                      "aspect-square rounded-sm ring-1 ring-stone-300/70",
                      previewColor.toLowerCase() === hex && "ring-2 ring-stone-900",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <select
            value={fontSelectValue}
            onChange={(e) => void onStyleChange(boardId, { title_font: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-5 max-w-[4.25rem] shrink-0 cursor-pointer rounded border border-black/10 bg-white/80 px-0.5 text-[9px] text-neutral-800"
            aria-label="Title font"
            title="Title font"
          >
            {TITLE_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </div>
  );
}
