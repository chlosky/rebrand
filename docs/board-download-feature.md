# Board download / export feature — code dump

Everything that produces downloadable files from boards: PNG (phone wallpaper),
PDF (print presets), and `.ics` calendar export.

Flow:

- UI: `BoardPrintDialog.tsx` (format + board picker) → calls `downloadBoardsPrintPdf` or `downloadPhoneWallpaper`.
- Rendering: `renderBoard.ts` composites the Fabric layout onto a page canvas → PNG dataURL / Blob, and builds the PDF via `jspdf`.
- Saving: `saveBoardImage.ts` (web download vs native share sheet).
- Geometry: `layoutScale.ts` (`fitArtboardInBox`) letterboxes the 1080×1350 (4:5) artboard into any page size.
- Calendar: `ical.ts` builds and downloads `.ics` files.

Artboard constants (from `src/components/boards/BoardCanvasEditor.tsx`):

```ts
export const ARTBOARD_WIDTH = 1080;
export const ARTBOARD_HEIGHT = 1350;

// Editor ref method used to get the current layout for export:
getLayoutJson: () => (fabricRef.current?.toJSON() as Record<string, unknown>) ?? {},
```

---

## src/lib/boards/renderBoard.ts

```ts
import { StaticCanvas, FabricImage } from "fabric";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";
import { boardFillForKey } from "@/lib/boards/colors";
import { fitArtboardInBox } from "@/lib/boards/layoutScale";
import { saveBoardImageBlob } from "@/lib/boards/saveBoardImage";

/** Browsers choke on huge PNG data URLs — cap longest side when compositing. */
const MAX_EXPORT_SIDE_PX = 8192;

function capPagePixels(pageWidthPx: number, pageHeightPx: number) {
  const longest = Math.max(pageWidthPx, pageHeightPx);
  if (longest <= MAX_EXPORT_SIDE_PX) {
    return { width: pageWidthPx, height: pageHeightPx, scale: 1 };
  }
  const scale = MAX_EXPORT_SIDE_PX / longest;
  return {
    width: Math.round(pageWidthPx * scale),
    height: Math.round(pageHeightPx * scale),
    scale,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      type,
      quality,
    );
  });
}

export type RenderBoardOptions = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  pageWidthPx: number;
  pageHeightPx: number;
  backgroundPageColor?: string;
  /** Override letterbox placement (phone wallpaper, etc.). */
  contentBox?: { x: number; y: number; width: number; height: number };
};

export async function renderBoardToDataUrl(options: RenderBoardOptions): Promise<string> {
  const {
    layoutJson,
    colorKey,
    pageWidthPx,
    pageHeightPx,
    backgroundPageColor = "#ffffff",
    contentBox: contentBoxOverride,
  } = options;
  const contentBox = contentBoxOverride ?? fitArtboardInBox(pageWidthPx, pageHeightPx);
  const bg = boardFillForKey(colorKey);
  const { width: outW, height: outH, scale: pageScale } = capPagePixels(pageWidthPx, pageHeightPx);
  const scaledContentBox = {
    x: contentBox.x * pageScale,
    y: contentBox.y * pageScale,
    width: contentBox.width * pageScale,
    height: contentBox.height * pageScale,
  };

  const contentEl = document.createElement("canvas");
  const contentCanvas = new StaticCanvas(contentEl, {
    width: ARTBOARD_WIDTH,
    height: ARTBOARD_HEIGHT,
    backgroundColor: bg,
  });

  const hasObjects =
    Array.isArray((layoutJson as { objects?: unknown[] }).objects) &&
    ((layoutJson as { objects: unknown[] }).objects?.length ?? 0) > 0;

  if (hasObjects) {
    await contentCanvas.loadFromJSON(layoutJson);
  }
  contentCanvas.backgroundColor = bg;
  contentCanvas.renderAll();
  const contentUrl = contentCanvas.toDataURL({ format: "png", multiplier: 1 });
  contentCanvas.dispose();

  const pageEl = document.createElement("canvas");
  const pageCanvas = new StaticCanvas(pageEl, {
    width: outW,
    height: outH,
    backgroundColor: backgroundPageColor,
  });

  if (contentBoxOverride) {
    const { Rect } = await import("fabric");
    pageCanvas.add(
      new Rect({
        left: scaledContentBox.x,
        top: scaledContentBox.y,
        width: scaledContentBox.width,
        height: scaledContentBox.height,
        fill: bg,
        selectable: false,
        evented: false,
      }),
    );
  }

  const snapshot = await FabricImage.fromURL(contentUrl);
  snapshot.set({
    left: scaledContentBox.x,
    top: scaledContentBox.y,
    scaleX: scaledContentBox.width / (snapshot.width || 1),
    scaleY: scaledContentBox.height / (snapshot.height || 1),
    selectable: false,
    evented: false,
  });
  pageCanvas.add(snapshot);
  pageCanvas.renderAll();

  const dataUrl = pageCanvas.toDataURL({ format: "png", multiplier: 1 });
  pageCanvas.dispose();
  return dataUrl;
}

export async function renderBoardToBlob(options: RenderBoardOptions): Promise<Blob> {
  const {
    layoutJson,
    colorKey,
    pageWidthPx,
    pageHeightPx,
    backgroundPageColor = "#ffffff",
    contentBox: contentBoxOverride,
  } = options;
  const contentBox = contentBoxOverride ?? fitArtboardInBox(pageWidthPx, pageHeightPx);
  const bg = boardFillForKey(colorKey);
  const { width: outW, height: outH, scale: pageScale } = capPagePixels(pageWidthPx, pageHeightPx);
  const scaledContentBox = {
    x: contentBox.x * pageScale,
    y: contentBox.y * pageScale,
    width: contentBox.width * pageScale,
    height: contentBox.height * pageScale,
  };

  const contentEl = document.createElement("canvas");
  const contentCanvas = new StaticCanvas(contentEl, {
    width: ARTBOARD_WIDTH,
    height: ARTBOARD_HEIGHT,
    backgroundColor: bg,
  });

  const hasObjects =
    Array.isArray((layoutJson as { objects?: unknown[] }).objects) &&
    ((layoutJson as { objects: unknown[] }).objects?.length ?? 0) > 0;

  if (hasObjects) {
    await contentCanvas.loadFromJSON(layoutJson);
  }
  contentCanvas.backgroundColor = bg;
  contentCanvas.renderAll();
  const contentUrl = contentCanvas.toDataURL({ format: "png", multiplier: 1 });
  contentCanvas.dispose();

  const pageEl = document.createElement("canvas");
  const pageCanvas = new StaticCanvas(pageEl, {
    width: outW,
    height: outH,
    backgroundColor: backgroundPageColor,
  });

  if (contentBoxOverride) {
    const { Rect } = await import("fabric");
    pageCanvas.add(
      new Rect({
        left: scaledContentBox.x,
        top: scaledContentBox.y,
        width: scaledContentBox.width,
        height: scaledContentBox.height,
        fill: bg,
        selectable: false,
        evented: false,
      }),
    );
  }

  const snapshot = await FabricImage.fromURL(contentUrl);
  snapshot.set({
    left: scaledContentBox.x,
    top: scaledContentBox.y,
    scaleX: scaledContentBox.width / (snapshot.width || 1),
    scaleY: scaledContentBox.height / (snapshot.height || 1),
    selectable: false,
    evented: false,
  });
  pageCanvas.add(snapshot);
  pageCanvas.renderAll();

  const blob = await canvasToBlob(pageCanvas.getElement());
  pageCanvas.dispose();
  return blob;
}

export function inchesToPixels(inches: number, dpi: number): number {
  return Math.round(inches * dpi);
}

/** Presets for home and professional printing. */
export const BOARD_PRINT_PRESETS = [
  {
    id: "screen",
    label: "Digital preview",
    description: "1080×1350 — matches the editor",
    pageWidthIn: ARTBOARD_WIDTH / 150,
    pageHeightIn: ARTBOARD_HEIGHT / 150,
    dpi: 150,
  },
  {
    id: "letter",
    label: 'US Letter (8.5×11")',
    description: "Home printer",
    pageWidthIn: 8.5,
    pageHeightIn: 11,
    dpi: 300,
  },
  {
    id: "super-b",
    label: 'Super B (13×19")',
    description: "Wide-format inkjet",
    pageWidthIn: 13,
    pageHeightIn: 19,
    dpi: 300,
  },
  {
    id: "18x24",
    label: '18×24" poster',
    description: "Print shop poster size",
    pageWidthIn: 18,
    pageHeightIn: 24,
    dpi: 300,
  },
  {
    id: "acrylic",
    label: '24×36" poster',
    description: "Large format print",
    pageWidthIn: 24,
    pageHeightIn: 36,
    dpi: 300,
  },
] as const;

export type BoardPrintPreset = (typeof BOARD_PRINT_PRESETS)[number];

function presetPixels(preset: BoardPrintPreset) {
  return {
    pageW: inchesToPixels(preset.pageWidthIn, preset.dpi),
    pageH: inchesToPixels(preset.pageHeightIn, preset.dpi),
  };
}

export type BoardPrintSource = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  title: string;
};

function boardFileSlug(title: string): string {
  return title.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 40) || "board";
}

export async function downloadBoardPrint(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  preset: BoardPrintPreset,
  title?: string,
): Promise<void> {
  const { pageW, pageH } = presetPixels(preset);
  const blob = await renderBoardToBlob({
    layoutJson,
    colorKey,
    pageWidthPx: pageW,
    pageHeightPx: pageH,
  });

  const slug = title ? boardFileSlug(title) : "board";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `palette-plot-${slug}-${preset.id}-${preset.dpi}dpi.png`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadBoardsPrintPdf(
  boards: BoardPrintSource[],
  preset: BoardPrintPreset,
  options?: { shareOnMobile?: boolean },
): Promise<void> {
  if (boards.length === 0) return;

  const { jsPDF } = await import("jspdf");
  const { pageW, pageH } = presetPixels(preset);
  const format: [number, number] = [preset.pageWidthIn, preset.pageHeightIn];
  const landscape = preset.pageWidthIn > preset.pageHeightIn;

  const pdf = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "in",
    format,
  });

  for (let i = 0; i < boards.length; i++) {
    const board = boards[i];
    if (i > 0) pdf.addPage(format, landscape ? "landscape" : "portrait");

    const dataUrl = await renderBoardToDataUrl({
      layoutJson: board.layoutJson,
      colorKey: board.colorKey,
      pageWidthPx: pageW,
      pageHeightPx: pageH,
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, preset.pageWidthIn, preset.pageHeightIn);
  }

  const slug =
    boards.length === 1
      ? boardFileSlug(boards[0].title)
      : `${boards.length}-boards`;
  const fileName = `palette-plot-${slug}-${preset.id}.pdf`;
  if (options?.shareOnMobile) {
    const blob = pdf.output("blob") as Blob;
    await saveBoardImageBlob(blob, fileName);
    return;
  }
  pdf.save(fileName);
}

export async function openBoardPrintWindow(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  preset: BoardPrintPreset,
): Promise<void> {
  const { pageW, pageH } = presetPixels(preset);
  const dataUrl = await renderBoardToDataUrl({
    layoutJson,
    colorKey,
    pageWidthPx: pageW,
    pageHeightPx: pageH,
  });

  const win = window.open("", "_blank");
  if (!win) throw new Error("popup blocked");
  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Print board</title>
    <style>
      @page { margin: 0; size: ${preset.pageWidthIn}in ${preset.pageHeightIn}in; }
      body { margin: 0; }
      img { width: 100%; height: auto; display: block; }
    </style>
    </head><body>
    <img src="${dataUrl}" alt="Board print" />
    <script>window.onload = () => { window.print(); }<\/script>
    </body></html>
  `);
  win.document.close();
}

/** Render artboard at native editor resolution (for board-to-board import). */
export async function renderBoardArtboardDataUrl(
  layoutJson: Record<string, unknown>,
  colorKey: string,
): Promise<string> {
  return renderBoardToDataUrl({
    layoutJson,
    colorKey,
    pageWidthPx: ARTBOARD_WIDTH,
    pageHeightPx: ARTBOARD_HEIGHT,
    backgroundPageColor: boardFillForKey(colorKey),
  });
}
```

---

## src/lib/boards/saveBoardImage.ts

```ts
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Download on web; share sheet on native (save to Photos from there). */
export async function saveBoardImageBlob(blob: Blob, fileName: string): Promise<"download" | "share"> {
  const safeName = fileName.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 180) || "board.png";

  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      url: written.uri,
      title: safeName,
    });
    return "share";
  }

  const file = new File([blob], safeName, { type: blob.type || "image/png" });
  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: safeName,
    });
    return "share";
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
  return "download";
}
```

---

## src/lib/boards/phoneWallpaper.ts

```ts
import { fitArtboardInBox } from "@/lib/boards/layoutScale";
import { renderBoardToBlob } from "@/lib/boards/renderBoard";
import { saveBoardImageBlob } from "@/lib/boards/saveBoardImage";

const PHONE_WIDTH = 1080;
const PHONE_HEIGHT = 2340;

export async function downloadPhoneWallpaper(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  boardTitle: string,
): Promise<"download" | "share"> {
  const blob = await renderBoardToBlob({
    layoutJson,
    colorKey,
    pageWidthPx: PHONE_WIDTH,
    pageHeightPx: PHONE_HEIGHT,
    contentBox: fitArtboardInBox(PHONE_WIDTH, PHONE_HEIGHT),
  });
  const slug = boardTitle.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 40) || "board";
  return saveBoardImageBlob(blob, `palette-plot-${slug}-phone.png`);
}
```

---

## src/lib/boards/layoutScale.ts

```ts
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";

const NUMERIC_LAYOUT_KEYS = [
  "left",
  "top",
  "width",
  "height",
  "fontSize",
  "strokeWidth",
  "rx",
  "ry",
  "radius",
  "padding",
] as const;

/** Scale Fabric layout JSON from artboard coordinates to a target pixel size. */
export function scaleLayoutJson(
  layoutJson: Record<string, unknown>,
  targetWidth: number,
  targetHeight: number,
): Record<string, unknown> {
  const scaleX = targetWidth / ARTBOARD_WIDTH;
  const scaleY = targetHeight / ARTBOARD_HEIGHT;
  const uniform = Math.min(scaleX, scaleY);
  const copy = JSON.parse(JSON.stringify(layoutJson)) as Record<string, unknown>;
  const objects = copy.objects;
  if (!Array.isArray(objects)) return copy;

  for (const raw of objects) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    for (const key of NUMERIC_LAYOUT_KEYS) {
      if (typeof obj[key] !== "number") continue;
      if (key === "left") obj.left = (obj.left as number) * scaleX;
      else if (key === "top") obj.top = (obj.top as number) * scaleY;
      else if (key === "fontSize" || key === "strokeWidth") obj[key] = (obj[key] as number) * uniform;
      else obj[key] = (obj[key] as number) * scaleX;
    }
  }

  return copy;
}

export function artboardAspectRatio(): number {
  return ARTBOARD_WIDTH / ARTBOARD_HEIGHT;
}

/** Fit 4:5 artboard content inside a page box (centered, letterboxed). */
export function fitArtboardInBox(
  pageWidth: number,
  pageHeight: number,
): { x: number; y: number; width: number; height: number } {
  const artAspect = artboardAspectRatio();
  const pageAspect = pageWidth / pageHeight;
  if (pageAspect > artAspect) {
    const height = pageHeight;
    const width = height * artAspect;
    return { x: (pageWidth - width) / 2, y: 0, width, height };
  }
  const width = pageWidth;
  const height = width / artAspect;
  return { x: 0, y: (pageHeight - height) / 2, width, height };
}
```

---

## src/lib/boards/ical.ts

```ts
import type { BoardReminder } from "@/lib/boards/types";
import type { AccountabilityReminder } from "@/lib/boards/accountabilityMap";
import { reminderToIso } from "@/lib/boards/accountabilityMap";

function formatIcalDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcal(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcalCalendar(reminders: BoardReminder[], calendarName = "Palette Plotting — The Plan"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Palette Plotting//Board Reminders//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const r of reminders) {
    const uid = r.ical_uid || `board-reminder-${r.id}@paletteplot.com`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcalDate(new Date().toISOString())}`,
      `DTSTART:${formatIcalDate(r.remind_at)}`,
      `SUMMARY:${escapeIcal(r.title)}`,
    );
    if (r.body) lines.push(`DESCRIPTION:${escapeIcal(r.body)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcalFile(reminders: BoardReminder[], filename = "palette-plotting-plan.ics"): void {
  const ics = buildIcalCalendar(reminders);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function weekdayToIcal(day: string | null | undefined): string {
  switch ((day ?? "monday").toLowerCase()) {
    case "monday":
      return "MO";
    case "tuesday":
      return "TU";
    case "wednesday":
      return "WE";
    case "thursday":
      return "TH";
    case "friday":
      return "FR";
    case "saturday":
      return "SA";
    case "sunday":
      return "SU";
    default:
      return "MO";
  }
}

function rruleForAccountabilityReminder(reminder: AccountabilityReminder): string {
  if (reminder.cadence === "daily") {
    return "RRULE:FREQ=DAILY";
  }

  if (reminder.cadence === "weekly") {
    return `RRULE:FREQ=WEEKLY;BYDAY=${weekdayToIcal(reminder.day_of_week)}`;
  }

  if (reminder.cadence === "monthly") {
    const dom = reminder.day_of_month ?? 1;
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${dom === -1 ? -1 : Math.min(31, Math.max(1, dom))}`;
  }

  return "RRULE:FREQ=MONTHLY;INTERVAL=3";
}

export function buildAccountabilityIcalCalendar(
  reminders: AccountabilityReminder[],
  calendarName = "Palette Plotting — Action Reminders",
): string {
  const now = new Date().toISOString();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Palette Plotting//Action Reminders//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  reminders.forEach((reminder, index) => {
    const startIso = reminderToIso(reminder);
    const uid = `palette-${reminder.action_id || `reminder-${index}`}@paletteplotting.com`;
    const description = [
      reminder.goal_title ? `Focus: ${reminder.goal_title}` : null,
      reminder.plan_title ? `Plan: ${reminder.plan_title}` : null,
      "Created in Palette Plotting.",
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcalDate(now)}`,
      `DTSTART:${formatIcalDate(startIso)}`,
      rruleForAccountabilityReminder(reminder),
      `SUMMARY:${escapeIcal(reminder.title)}`,
      `DESCRIPTION:${escapeIcal(description)}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadAccountabilityIcalFile(
  reminders: AccountabilityReminder[],
  filename = "palette-plotting-action-reminders.ics",
): void {
  const ics = buildAccountabilityIcalCalendar(reminders);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## src/components/boards/BoardPrintDialog.tsx

```tsx
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BOARD_PRINT_PRESETS,
  downloadBoardsPrintPdf,
  type BoardPrintPreset,
} from "@/lib/boards/renderBoard";
import { downloadPhoneWallpaper } from "@/lib/boards/phoneWallpaper";
import type { Board } from "@/lib/boards/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

type DownloadOptionId = BoardPrintPreset["id"] | "phone-wallpaper";

const DOWNLOAD_OPTIONS: { id: DownloadOptionId; label: string; description: string }[] = [
  ...BOARD_PRINT_PRESETS.map((p) => ({
    id: p.id,
    label: `${p.label} — ${p.dpi} DPI`,
    description: p.description,
  })),
  {
    id: "phone-wallpaper",
    label: "Phone wallpaper",
    description: "Portrait PNG for your phone — pick one board below",
  },
];

type BoardPrintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  activeBoardId: string;
  getLayoutJson: (boardId: string) => Record<string, unknown>;
};

export function BoardPrintDialog({
  open,
  onOpenChange,
  boards,
  activeBoardId,
  getLayoutJson,
}: BoardPrintDialogProps) {
  const isMobile = useIsMobile();
  const [optionId, setOptionId] = useState<DownloadOptionId>("letter");
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isPhoneWallpaper = optionId === "phone-wallpaper";
  const printPreset = BOARD_PRINT_PRESETS.find((p) => p.id === optionId);
  const option = DOWNLOAD_OPTIONS.find((o) => o.id === optionId) ?? DOWNLOAD_OPTIONS[1];

  useEffect(() => {
    if (!open) return;
    setSelectedBoardIds(boards.map((b) => b.id));
  }, [open, boards]);

  useEffect(() => {
    if (!isPhoneWallpaper) return;
    setSelectedBoardIds((prev) => {
      if (prev.length === 1) return prev;
      const pick = boards.some((b) => b.id === activeBoardId) ? activeBoardId : boards[0]?.id;
      return pick ? [pick] : [];
    });
  }, [isPhoneWallpaper, activeBoardId, boards]);

  const selectedBoards = useMemo(
    () => boards.filter((b) => selectedBoardIds.includes(b.id)),
    [boards, selectedBoardIds],
  );

  const canDownload = isPhoneWallpaper ? selectedBoards.length === 1 : selectedBoards.length > 0;

  const selectPhoneWallpaperBoard = (boardId: string) => {
    setSelectedBoardIds([boardId]);
  };

  const toggleBoard = (boardId: string, checked: boolean) => {
    setSelectedBoardIds((prev) => {
      if (checked) return prev.includes(boardId) ? prev : [...prev, boardId];
      return prev.filter((id) => id !== boardId);
    });
  };

  const handleDownload = async () => {
    if (!canDownload) return;
    setBusy(true);
    try {
      if (isPhoneWallpaper) {
        const board = selectedBoards[0];
        if (!board) return;
        await downloadPhoneWallpaper(
          getLayoutJson(board.id),
          board.color_key,
          board.title,
        );
        toast.success(`Downloaded ${board.title} as phone wallpaper`);
      } else if (printPreset) {
        const sources = selectedBoards.map((board) => ({
          layoutJson: getLayoutJson(board.id),
          colorKey: board.color_key,
          title: board.title,
        }));

        await downloadBoardsPrintPdf(sources, printPreset, { shareOnMobile: isMobile });
        toast.success(
          sources.length === 1
            ? `Downloaded ${sources[0].title} as PDF (${printPreset.label})`
            : `Downloaded ${sources.length} boards as PDF (${printPreset.label})`,
        );
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Board download failed:", err);
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        onOpenAutoFocus={isMobile ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>Download</DialogTitle>
          <DialogDescription>
            {isPhoneWallpaper
              ? "Pick one board below. Downloads as a PNG phone wallpaper."
              : "Choose a print format and select boards. Downloads as PDF (one page per board)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Format</Label>
            <select
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={optionId}
              onChange={(e) => {
                const next = e.target.value as DownloadOptionId;
                setOptionId(next);
                if (next === "phone-wallpaper") {
                  const pick = boards.some((b) => b.id === activeBoardId) ? activeBoardId : boards[0]?.id;
                  if (pick) setSelectedBoardIds([pick]);
                } else if (selectedBoardIds.length <= 1) {
                  setSelectedBoardIds(boards.map((b) => b.id));
                }
              }}
            >
              {DOWNLOAD_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] leading-snug text-neutral-500">{option.description}</p>
            {printPreset && printPreset.dpi === 300 && printPreset.pageWidthIn >= 18 && (
              <p className="text-[11px] leading-snug text-amber-800">
                Large exports can take a moment and produce a big file.
              </p>
            )}
          </div>

          {boards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Boards</Label>
                {!isPhoneWallpaper && boards.length > 1 ? (
                  <button
                    type="button"
                    className="text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                    onClick={() =>
                      setSelectedBoardIds(
                        selectedBoardIds.length === boards.length ? [] : boards.map((b) => b.id),
                      )
                    }
                  >
                    {selectedBoardIds.length === boards.length ? "Deselect all" : "Select all"}
                  </button>
                ) : null}
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-neutral-200 p-2">
                {boards.map((board) => {
                  const checked = selectedBoardIds.includes(board.id);
                  return (
                    <label
                      key={board.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-neutral-50"
                    >
                      {isPhoneWallpaper ? (
                        <input
                          type="radio"
                          name="download-board"
                          checked={checked}
                          onChange={() => selectPhoneWallpaperBoard(board.id)}
                          className="h-4 w-4 shrink-0 accent-neutral-900"
                        />
                      ) : (
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleBoard(board.id, value === true)}
                        />
                      )}
                      <span className="min-w-0 truncate">
                        {board.title}
                        {board.id === activeBoardId ? (
                          <span className="ml-1 text-[11px] text-neutral-400">(current)</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] leading-snug text-neutral-500">
                {isPhoneWallpaper
                  ? selectedBoards.length === 1
                    ? "One board — downloads as PNG."
                    : "Pick one board."
                  : selectedBoards.length === 0
                    ? "Select at least one board."
                    : selectedBoards.length === 1
                      ? "One board — downloads as PDF."
                      : `${selectedBoards.length} boards — one page each in a PDF.`}
              </p>
            </div>
          )}
        </div>

        <Button className="gap-2" disabled={busy || !canDownload} onClick={() => void handleDownload()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isPhoneWallpaper ? "Download PNG" : "Download PDF"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Wiring in src/pages/features/Boards.tsx

```tsx
import { BoardPrintDialog } from "@/components/boards/BoardPrintDialog";

// Live layout for the active board (falls back to saved layout_json):
const activeLayoutJson =
  editorMapRef.current.get(activeBoard.id)?.getLayoutJson() ?? activeBoard.layout_json;

// Dialog render — getLayoutJson pulls the live Fabric JSON per board:
<BoardPrintDialog
  open={downloadOpen}
  onOpenChange={setDownloadOpen}
  boards={workspace.boards}
  activeBoardId={activeBoard.id}
  getLayoutJson={(boardId) => {
    const editor = editorMapRef.current.get(boardId);
    if (editor) return editor.getLayoutJson();
    return workspace.boards.find((b) => b.id === boardId)?.layout_json ?? {};
  }}
/>
```

## iCal export handler in src/pages/features/BoardAccountability.tsx

```tsx
import { downloadAccountabilityIcalFile } from "@/lib/boards/ical";

// ...
downloadAccountabilityIcalFile(calendarReminders, "palette-plotting-action-reminders.ics");
```

---

## Likely culprits for "wrong files" (things to check)

- **Blank / empty output:** export uses `layoutJson`. If the editor ref isn't registered in `editorMapRef` for a board, it falls back to the saved `layout_json`, which may be stale or empty (`{}`). `renderBoardToBlob` only calls `loadFromJSON` when `objects.length > 0`, otherwise you get a solid background with no content.
- **Content shifted / wrong scale:** `renderBoard` composites the artboard as a single PNG snapshot into `scaledContentBox` (from `fitArtboardInBox`). It does **not** use `scaleLayoutJson` — text/strokes are raster-scaled from the 1080×1350 snapshot, so very large presets can look soft.
- **Cropped:** `fitArtboardInBox` letterboxes 4:5 into the page; if the page aspect differs a lot (e.g. Letter 8.5×11) there will be top/bottom or side margins by design.
- **Huge/failed PNG:** `MAX_EXPORT_SIDE_PX = 8192` caps the longest side; 24×36 at 300 DPI (7200×10800) is under the cap, but memory can still fail on some devices.
- **Fonts/images missing:** custom fonts or cross-origin images must be loaded before `loadFromJSON`/`renderAll`, or they won't appear in the exported PNG.
- **Mobile:** on native/mobile it goes through the **share sheet** (`saveBoardImageBlob`), not a direct file download — if `navigator.share` is unavailable it falls back to an `<a download>` click.
- **iCal all-day vs timed:** every `DTSTART` is written as a UTC timestamp (`...Z`); if `remind_at` / `reminderToIso` produces an unexpected time or timezone, events land at the wrong hour.
```
