import { StaticCanvas, FabricImage } from "fabric";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH, restoreBoardLayoutAfterLoad } from "@/components/boards/BoardCanvasEditor";
import { readArtboardSizeFromLayoutJson } from "@/lib/boards/artboard";
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
  /** Source artboard dimensions (portrait 1080×1350, landscape 1350×1080). */
  artboardWidth?: number;
  artboardHeight?: number;
  backgroundPageColor?: string;
  /** Override letterbox placement (phone wallpaper, etc.). */
  contentBox?: { x: number; y: number; width: number; height: number };
  /**
   * Print exports must preserve exact pixel dimensions.
   * Preview/mobile exports may cap pixels to protect browser memory.
   */
  preservePixelDimensions?: boolean;
  imageFormat?: "png" | "jpeg";
  imageQuality?: number;
};

export async function renderBoardToDataUrl(options: RenderBoardOptions): Promise<string> {
  const {
    layoutJson,
    colorKey,
    pageWidthPx,
    pageHeightPx,
    artboardWidth,
    artboardHeight,
    backgroundPageColor = "#ffffff",
    contentBox: contentBoxOverride,
    preservePixelDimensions = false,
    imageFormat = "png",
    imageQuality,
  } = options;
  const sourceSize = readArtboardSizeFromLayoutJson(
    layoutJson,
    artboardWidth && artboardHeight && artboardWidth > artboardHeight ? "landscape" : "portrait",
  );
  const sourceWidth = artboardWidth ?? sourceSize.width;
  const sourceHeight = artboardHeight ?? sourceSize.height;
  const contentBox =
    contentBoxOverride ?? fitArtboardInBox(pageWidthPx, pageHeightPx, sourceWidth, sourceHeight);
  const bg = boardFillForKey(colorKey);
  const pixelBox = preservePixelDimensions
    ? { width: pageWidthPx, height: pageHeightPx, scale: 1 }
    : capPagePixels(pageWidthPx, pageHeightPx);
  const { width: outW, height: outH, scale: pageScale } = pixelBox;
  const scaledContentBox = {
    x: contentBox.x * pageScale,
    y: contentBox.y * pageScale,
    width: contentBox.width * pageScale,
    height: contentBox.height * pageScale,
  };

  const contentEl = document.createElement("canvas");
  const contentCanvas = new StaticCanvas(contentEl, {
    width: sourceWidth,
    height: sourceHeight,
    backgroundColor: bg,
  });

  const hasObjects =
    Array.isArray((layoutJson as { objects?: unknown[] }).objects) &&
    ((layoutJson as { objects: unknown[] }).objects?.length ?? 0) > 0;

  if (hasObjects) {
    await contentCanvas.loadFromJSON(layoutJson);
    restoreBoardLayoutAfterLoad(contentCanvas);
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

  const dataUrl = pageCanvas.toDataURL({
    format: imageFormat,
    quality: imageFormat === "jpeg" ? imageQuality ?? 0.92 : undefined,
    multiplier: 1,
  });
  pageCanvas.dispose();
  return dataUrl;
}

export async function renderBoardToBlob(options: RenderBoardOptions): Promise<Blob> {
  const {
    layoutJson,
    colorKey,
    pageWidthPx,
    pageHeightPx,
    artboardWidth,
    artboardHeight,
    backgroundPageColor = "#ffffff",
    contentBox: contentBoxOverride,
    preservePixelDimensions = false,
    imageFormat = "png",
    imageQuality,
  } = options;
  const sourceSize = readArtboardSizeFromLayoutJson(
    layoutJson,
    artboardWidth && artboardHeight && artboardWidth > artboardHeight ? "landscape" : "portrait",
  );
  const sourceWidth = artboardWidth ?? sourceSize.width;
  const sourceHeight = artboardHeight ?? sourceSize.height;
  const contentBox =
    contentBoxOverride ?? fitArtboardInBox(pageWidthPx, pageHeightPx, sourceWidth, sourceHeight);
  const bg = boardFillForKey(colorKey);
  const pixelBox = preservePixelDimensions
    ? { width: pageWidthPx, height: pageHeightPx, scale: 1 }
    : capPagePixels(pageWidthPx, pageHeightPx);
  const { width: outW, height: outH, scale: pageScale } = pixelBox;
  const scaledContentBox = {
    x: contentBox.x * pageScale,
    y: contentBox.y * pageScale,
    width: contentBox.width * pageScale,
    height: contentBox.height * pageScale,
  };

  const contentEl = document.createElement("canvas");
  const contentCanvas = new StaticCanvas(contentEl, {
    width: sourceWidth,
    height: sourceHeight,
    backgroundColor: bg,
  });

  const hasObjects =
    Array.isArray((layoutJson as { objects?: unknown[] }).objects) &&
    ((layoutJson as { objects: unknown[] }).objects?.length ?? 0) > 0;

  if (hasObjects) {
    await contentCanvas.loadFromJSON(layoutJson);
    restoreBoardLayoutAfterLoad(contentCanvas);
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

  const blob = await canvasToBlob(
    pageCanvas.getElement(),
    imageFormat === "jpeg" ? "image/jpeg" : "image/png",
    imageFormat === "jpeg" ? imageQuality ?? 0.92 : undefined,
  );
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
    id: "24x36",
    label: '24×36" poster',
    description: "Large format print",
    pageWidthIn: 24,
    pageHeightIn: 36,
    dpi: 300,
  },
] as const;

export type BoardPrintPreset = (typeof BOARD_PRINT_PRESETS)[number];

function inchesToPoints(inches: number): number {
  return inches * 72;
}

export function getPrintPresetOutputSpec(preset: BoardPrintPreset) {
  const pageWidthPx = inchesToPixels(preset.pageWidthIn, preset.dpi);
  const pageHeightPx = inchesToPixels(preset.pageHeightIn, preset.dpi);

  return {
    pageWidthIn: preset.pageWidthIn,
    pageHeightIn: preset.pageHeightIn,
    dpi: preset.dpi,
    pageWidthPx,
    pageHeightPx,
    pageWidthPt: inchesToPoints(preset.pageWidthIn),
    pageHeightPt: inchesToPoints(preset.pageHeightIn),
    label: `${preset.pageWidthIn}×${preset.pageHeightIn} in · ${pageWidthPx}×${pageHeightPx} px · ${preset.dpi} DPI`,
  };
}

function presetPixels(preset: BoardPrintPreset) {
  const spec = getPrintPresetOutputSpec(preset);
  return {
    pageW: spec.pageWidthPx,
    pageH: spec.pageHeightPx,
  };
}

export type BoardPrintSource = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  title: string;
  artboardWidth?: number;
  artboardHeight?: number;
  orientation?: "portrait" | "landscape";
};

/** Print page inches, rotated to match the board's orientation. */
function pageInchesForBoard(
  preset: BoardPrintPreset,
  sourceWidth: number,
  sourceHeight: number,
): { pageWidthIn: number; pageHeightIn: number } {
  if (preset.id === "screen") {
    return {
      pageWidthIn: sourceWidth / preset.dpi,
      pageHeightIn: sourceHeight / preset.dpi,
    };
  }
  const boardIsLandscape = sourceWidth > sourceHeight;
  const shortSide = Math.min(preset.pageWidthIn, preset.pageHeightIn);
  const longSide = Math.max(preset.pageWidthIn, preset.pageHeightIn);
  return boardIsLandscape
    ? { pageWidthIn: longSide, pageHeightIn: shortSide }
    : { pageWidthIn: shortSide, pageHeightIn: longSide };
}

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

  // Each board sizes its own page so landscape boards get landscape pages.
  let pdf: import("jspdf").jsPDF | null = null;

  for (let i = 0; i < boards.length; i++) {
    const board = boards[i];
    const sourceSize = readArtboardSizeFromLayoutJson(
      board.layoutJson,
      board.orientation ?? "portrait",
    );
    const sourceWidth = board.artboardWidth ?? sourceSize.width;
    const sourceHeight = board.artboardHeight ?? sourceSize.height;

    const pageInches = pageInchesForBoard(preset, sourceWidth, sourceHeight);
    const pageWidthPx = inchesToPixels(pageInches.pageWidthIn, preset.dpi);
    const pageHeightPx = inchesToPixels(pageInches.pageHeightIn, preset.dpi);
    const pageWidthPt = pageInches.pageWidthIn * 72;
    const pageHeightPt = pageInches.pageHeightIn * 72;
    const orientation = pageWidthPt > pageHeightPt ? "landscape" : "portrait";
    const format: [number, number] = [pageWidthPt, pageHeightPt];

    if (!pdf) {
      pdf = new jsPDF({ orientation, unit: "pt", format, compress: true });
    } else {
      pdf.addPage(format, orientation);
    }

    const dataUrl = await renderBoardToDataUrl({
      layoutJson: board.layoutJson,
      colorKey: board.colorKey,
      pageWidthPx,
      pageHeightPx,
      artboardWidth: sourceWidth,
      artboardHeight: sourceHeight,
      backgroundPageColor: boardFillForKey(board.colorKey),
      preservePixelDimensions: true,
      imageFormat: "jpeg",
      imageQuality: 0.92,
    });
    pdf.addImage(dataUrl, "JPEG", 0, 0, pageWidthPt, pageHeightPt, undefined, "FAST");
  }

  if (!pdf) return;

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
  const source = readArtboardSizeFromLayoutJson(layoutJson);
  return renderBoardToDataUrl({
    layoutJson,
    colorKey,
    pageWidthPx: source.width,
    pageHeightPx: source.height,
    artboardWidth: source.width,
    artboardHeight: source.height,
    backgroundPageColor: boardFillForKey(colorKey),
  });
}
