import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  onRename: (boardId: string, title: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
};

export function BoardEditableTitle({
  boardId,
  title,
  headerFill,
  onRename,
  className,
  inputClassName,
}: BoardEditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const textColor = titleColorForFill(headerFill);

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
        style={{ color: textColor }}
        className={cn(
          "min-w-0 flex-1 rounded border border-neutral-400 bg-white/90 px-1 py-0 text-inherit outline-none ring-1 ring-neutral-900/10 focus:border-neutral-600",
          inputClassName,
        )}
        aria-label="Board name"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      style={{ color: textColor }}
      className={cn(
        "min-w-0 flex-1 truncate text-left decoration-dotted underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none",
        className,
      )}
      title="Click to rename"
    >
      {title}
    </button>
  );
}
