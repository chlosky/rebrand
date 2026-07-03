import { StaticCanvas, FabricImage } from "fabric";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";
import { boardFillForKey } from "@/lib/boards/colors";
import { fitArtboardInBox, scaleLayoutJson } from "@/lib/boards/layoutScale";

export type RenderBoardOptions = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  pageWidthPx: number;
  pageHeightPx: number;
  backgroundPageColor?: string;
  /** Override letterbox placement (phone wallpaper, etc.). */
  contentBox?: { x: number; y: number; width: number; height: number };
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function renderBoardToDataUrl(options: RenderBoardOptions): Promise<string> {
  const { layoutJson, colorKey, pageWidthPx, pageHeightPx, backgroundPageColor = "#ffffff", contentBox: contentBoxOverride } = options;
  const contentBox = contentBoxOverride ?? fitArtboardInBox(pageWidthPx, pageHeightPx);
  const scaledLayout = scaleLayoutJson(layoutJson, contentBox.width, contentBox.height);
  const bg = boardFillForKey(colorKey);

  const contentEl = document.createElement("canvas");
  const contentCanvas = new StaticCanvas(contentEl, {
    width: contentBox.width,
    height: contentBox.height,
    backgroundColor: bg,
  });

  const hasObjects =
    Array.isArray((scaledLayout as { objects?: unknown[] }).objects) &&
    ((scaledLayout as { objects: unknown[] }).objects?.length ?? 0) > 0;

  if (hasObjects) {
    await contentCanvas.loadFromJSON(scaledLayout);
  }
  contentCanvas.backgroundColor = bg;
  contentCanvas.renderAll();
  const contentUrl = contentCanvas.toDataURL({ format: "png", multiplier: 1 });
  contentCanvas.dispose();

  const pageEl = document.createElement("canvas");
  const pageCanvas = new StaticCanvas(pageEl, {
    width: pageWidthPx,
    height: pageHeightPx,
    backgroundColor: backgroundPageColor,
  });

  if (contentBoxOverride) {
    const { Rect } = await import("fabric");
    const bg = boardFillForKey(colorKey);
    pageCanvas.add(
      new Rect({
        left: contentBox.x,
        top: contentBox.y,
        width: contentBox.width,
        height: contentBox.height,
        fill: bg,
        selectable: false,
        evented: false,
      }),
    );
  }

  const snapshot = await FabricImage.fromURL(contentUrl);
  snapshot.set({
    left: contentBox.x,
    top: contentBox.y,
    scaleX: contentBox.width / (snapshot.width || 1),
    scaleY: contentBox.height / (snapshot.height || 1),
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
  return dataUrlToBlob(await renderBoardToDataUrl(options));
}

export function inchesToPixels(inches: number, dpi: number): number {
  return Math.round(inches * dpi);
}

/** Presets for home printers and print shops (Kinko's, etc.). */
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
    id: "tabloid",
    label: 'Tabloid (11×17")',
    description: "Large home / office printer",
    pageWidthIn: 11,
    pageHeightIn: 17,
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
    label: 'Acrylic board (24×36")',
    description: "Matches paletteplot.com physical boards — Kinko's / FedEx Office",
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

export async function downloadBoardPrint(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  preset: BoardPrintPreset,
): Promise<void> {
  const { pageW, pageH } = presetPixels(preset);
  const blob = await renderBoardToBlob({
    layoutJson,
    colorKey,
    pageWidthPx: pageW,
    pageHeightPx: pageH,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `palette-plot-board-${preset.id}-${preset.dpi}dpi.png`;
  a.click();
  URL.revokeObjectURL(url);
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
