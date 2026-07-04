import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TITLE_FONTS = [
  { id: "system", label: "Clean", family: "system-ui, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "display", label: "Bold", family: "'Arial Black', 'Helvetica Neue', sans-serif" },
  { id: "script", label: "Script", family: "'Brush Script MT', 'Segoe Script', cursive" },
] as const;

function titleColorForFill(fillHex: string): string {
  const hex = fillHex.replace("#", "");
  if (hex.length !== 6) return "#171717";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55 ? "#ffffff" : "#171717";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedColor = titleColor ?? titleColorForFill(headerFill);
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
        style={{ color: resolvedColor, fontFamily: resolvedFont }}
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
        style={{ color: resolvedColor, fontFamily: resolvedFont }}
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
          <label
            className="relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded ring-1 ring-black/10"
            title="Title color"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="h-4 w-4 rounded-sm ring-1 ring-inset ring-black/10" style={{ backgroundColor: resolvedColor }} aria-hidden />
            <input
              type="color"
              value={resolvedColor}
              onChange={(e) => void onStyleChange(boardId, { title_color: e.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Title color"
            />
          </label>
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
