import { useCallback, useEffect, useRef, useState } from "react";
import { BOARD_QUICK_PICK_COLORS, normalizeBoardColorHex } from "@/lib/boards/colors";
import { cn } from "@/lib/utils";

const MAX_COLOR_PRESETS = 7;

type BoardColorStripProps = {
  userId: string;
  activeBoardFill: string;
  onColorChange: (hex: string) => void;
  className?: string;
  swatchSize?: "sm" | "md";
};

type Hsv = { h: number; s: number; v: number };

function presetStorageKey(userId: string) {
  return `board-color-presets:${userId}`;
}

function readColorPresets(userId: string): string[] {
  try {
    const raw = localStorage.getItem(presetStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => (typeof value === "string" ? normalizeBoardColorHex(value) : null))
      .filter((value): value is string => Boolean(value))
      .slice(0, MAX_COLOR_PRESETS);
  } catch {
    return [];
  }
}

function writeColorPresets(userId: string, presets: string[]) {
  localStorage.setItem(presetStorageKey(userId), JSON.stringify(presets.slice(0, MAX_COLOR_PRESETS)));
}

function hexToHsv(hex: string): Hsv {
  const normalized = normalizeBoardColorHex(hex) ?? "#fafafa";
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

export function BoardColorStrip({
  userId,
  activeBoardFill,
  onColorChange,
  className,
  swatchSize = "sm",
}: BoardColorStripProps) {
  const [hexDraft, setHexDraft] = useState(activeBoardFill);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(activeBoardFill));
  const [presets, setPresets] = useState<string[]>(() => readColorPresets(userId));
  const svRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    setPresets(readColorPresets(userId));
  }, [userId]);

  useEffect(() => {
    setHexDraft(activeBoardFill);
    if (!draggingRef.current) {
      setHsv(hexToHsv(activeBoardFill));
    }
  }, [activeBoardFill]);

  const commitHex = useCallback(
    (raw: string, closeWheel = false) => {
      const hex = normalizeBoardColorHex(raw);
      if (!hex) {
        setHexDraft(activeBoardFill);
        setHsv(hexToHsv(activeBoardFill));
        return;
      }
      setHexDraft(hex);
      setHsv(hexToHsv(hex));
      onColorChange(hex);
      if (closeWheel) setWheelOpen(false);
    },
    [activeBoardFill, onColorChange],
  );

  const applyHsv = useCallback(
    (next: Hsv, commit: boolean) => {
      draggingRef.current = !commit;
      const hex = hsvToHex(next);
      setHsv(next);
      setHexDraft(hex);
      if (commit) {
        draggingRef.current = false;
        onColorChange(hex);
      }
    },
    [onColorChange],
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

  const applyQuickPick = (hex: string) => {
    setWheelOpen(false);
    commitHex(hex);
  };

  const togglePreset = () => {
    const hex = normalizeBoardColorHex(hexDraft);
    if (!hex) return;
    if (presets.includes(hex)) {
      const next = presets.filter((p) => p !== hex);
      setPresets(next);
      writeColorPresets(userId, next);
      return;
    }
    const next = [hex, ...presets.filter((p) => p !== hex)].slice(0, MAX_COLOR_PRESETS);
    setPresets(next);
    writeColorPresets(userId, next);
  };

  const presetSaved = presets.includes(normalizeBoardColorHex(hexDraft) ?? "");

  return (
    <div className={cn("border-b border-stone-300/50", className)}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Board color</p>

      <div className="mb-2 overflow-hidden rounded-lg border border-stone-300/80 bg-white">
        <button
          type="button"
          onClick={() => setWheelOpen((open) => !open)}
          className="flex w-full px-2.5 py-2 text-left"
          aria-expanded={wheelOpen}
          aria-label={wheelOpen ? "Close color wheel" : "Select from color wheel"}
        >
          <span className="text-[10px] font-medium text-stone-500">
            {wheelOpen ? "Close picker" : "Select from color wheel"}
          </span>
        </button>

        {wheelOpen ? (
          <div className="space-y-2 border-t border-stone-200/80 px-2.5 pb-2.5 pt-2">
            <div
              ref={svRef}
              className="relative h-28 w-full cursor-crosshair touch-none overflow-hidden rounded-md"
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
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={360}
              value={Math.round(hsv.h)}
              onChange={(e) => applyHsv({ ...hsv, h: Number(e.target.value) }, true)}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.35)] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              aria-label="Hue"
            />

            <p className="text-center font-mono text-[11px] uppercase text-stone-600">{hexDraft}</p>
          </div>
        ) : (
          <>
            <div className="h-10 border-t border-stone-200/80" style={{ backgroundColor: hexDraft }} aria-hidden />
            <div className="flex items-center justify-between gap-2 border-t border-stone-200/80 px-2.5 py-1.5">
              <span className="font-mono text-[11px] uppercase text-stone-700">{hexDraft}</span>
              <button
                type="button"
                onClick={togglePreset}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-stone-600 transition-colors hover:bg-stone-100",
                  presetSaved && "text-stone-500",
                )}
                aria-label={presetSaved ? "Remove from presets" : "Mark current color as preset"}
              >
                <span
                  className="h-3.5 w-3.5 rounded-sm ring-1 ring-stone-300/70"
                  style={{ backgroundColor: hexDraft }}
                  aria-hidden
                />
                {presetSaved ? "Saved" : "Mark as preset"}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="mb-1.5 text-[10px] text-stone-500">Standard colors</p>
      <div className="grid grid-cols-7 gap-1.5">
        {BOARD_QUICK_PICK_COLORS.map((pick) => (
          <button
            key={pick.hex}
            type="button"
            title={`${pick.label} · ${pick.hex}`}
            onClick={() => applyQuickPick(pick.hex)}
            className={cn(
              "aspect-square rounded-md ring-1 ring-stone-300/60 transition-transform hover:scale-105",
              swatchSize === "md" && "rounded-lg",
              activeBoardFill === pick.hex && "ring-2 ring-stone-900",
            )}
            style={{ backgroundColor: pick.hex }}
          />
        ))}
      </div>

      {presets.length > 0 ? (
        <>
          <p className="mb-1.5 mt-2 text-[10px] text-stone-500">Your presets</p>
          <div className="grid grid-cols-7 gap-1.5">
            {presets.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => applyQuickPick(hex)}
                className={cn(
                  "aspect-square rounded-md ring-1 ring-stone-300/60 transition-transform hover:scale-105",
                  swatchSize === "md" && "rounded-lg",
                  activeBoardFill === hex && "ring-2 ring-stone-900",
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
