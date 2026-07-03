import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";
import { artboardAspectRatio, fitArtboardInBox } from "@/lib/boards/layoutScale";
import { renderBoardToBlob, type RenderBoardOptions } from "@/lib/boards/renderBoard";
import { saveBoardImageBlob } from "@/lib/boards/saveBoardImage";

export type PhoneWallpaperMode = "wallpaper" | "lockscreen";
export type PhoneWallpaperStyle = "fit" | "fill";

export type PhoneWallpaperPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
};

/** Common portrait phone sizes (px). */
export const PHONE_WALLPAPER_PRESETS: PhoneWallpaperPreset[] = [
  { id: "auto", label: "This device", width: 0, height: 0 },
  { id: "iphone-67", label: "iPhone 6.7″", width: 1290, height: 2796 },
  { id: "iphone-61", label: "iPhone 6.1″", width: 1179, height: 2556 },
  { id: "android", label: "Android", width: 1080, height: 2400 },
  { id: "android-hd", label: "Android HD", width: 1440, height: 3200 },
];

export function detectPhoneWallpaperSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1290, height: 2796 };
  }
  const dpr = Math.min(window.devicePixelRatio || 2, 3);
  const w = Math.round(window.screen.width * dpr);
  const h = Math.round(window.screen.height * dpr);
  const portrait = h >= w ? { width: w, height: h } : { width: h, height: w };
  return {
    width: Math.max(1080, portrait.width),
    height: Math.max(1920, portrait.height),
  };
}

export function resolvePhonePreset(presetId: string): { width: number; height: number; label: string } {
  if (presetId === "auto") {
    const detected = detectPhoneWallpaperSize();
    return { ...detected, label: "This device" };
  }
  const preset = PHONE_WALLPAPER_PRESETS.find((p) => p.id === presetId);
  if (!preset || preset.id === "auto") {
    return { ...detectPhoneWallpaperSize(), label: "This device" };
  }
  return { width: preset.width, height: preset.height, label: preset.label };
}

export function computePhoneContentBox(
  pageWidth: number,
  pageHeight: number,
  mode: PhoneWallpaperMode,
  style: PhoneWallpaperStyle,
): { x: number; y: number; width: number; height: number } {
  const artAspect = artboardAspectRatio();
  const pageAspect = pageWidth / pageHeight;

  if (style === "fill") {
    if (artAspect > pageAspect) {
      const height = pageHeight;
      const width = height * artAspect;
      let y = 0;
      if (mode === "lockscreen") y = -pageHeight * 0.06;
      return { x: (pageWidth - width) / 2, y, width, height };
    }
    const width = pageWidth;
    const height = width / artAspect;
    let y = (pageHeight - height) / 2;
    if (mode === "lockscreen") y += pageHeight * 0.1;
    return { x: 0, y, width, height };
  }

  const box = fitArtboardInBox(pageWidth, pageHeight);
  if (mode === "lockscreen") {
    box.y += pageHeight * 0.11;
    box.y = Math.min(box.y, pageHeight - box.height - pageHeight * 0.05);
  }
  return box;
}

export async function renderPhoneWallpaperBlob(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  options: {
    mode: PhoneWallpaperMode;
    style?: PhoneWallpaperStyle;
    presetId?: string;
    width?: number;
    height?: number;
  },
): Promise<Blob> {
  const resolved =
    options.width && options.height
      ? { width: options.width, height: options.height }
      : resolvePhonePreset(options.presetId ?? "auto");

  const style = options.style ?? "fit";
  const contentBox = computePhoneContentBox(resolved.width, resolved.height, options.mode, style);

  const renderOpts: RenderBoardOptions = {
    layoutJson,
    colorKey,
    pageWidthPx: resolved.width,
    pageHeightPx: resolved.height,
    contentBox,
  };

  return renderBoardToBlob(renderOpts);
}

export async function savePhoneWallpaper(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  boardTitle: string,
  options: {
    mode: PhoneWallpaperMode;
    style?: PhoneWallpaperStyle;
    presetId?: string;
  },
): Promise<"download" | "share"> {
  const blob = await renderPhoneWallpaperBlob(layoutJson, colorKey, options);
  const slug = boardTitle.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 40) || "board";
  const fileName = `palette-plot-${options.mode}-${slug}.png`;
  return saveBoardImageBlob(blob, fileName);
}

/** Quick export at detected device size without opening the dialog. */
export async function quickSavePhoneWallpaper(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  boardTitle: string,
  mode: PhoneWallpaperMode,
): Promise<"download" | "share"> {
  return savePhoneWallpaper(layoutJson, colorKey, boardTitle, {
    mode,
    presetId: "auto",
    style: "fit",
  });
}

export const PHONE_ARTBOARD_LABEL = `${ARTBOARD_WIDTH}×${ARTBOARD_HEIGHT}`;
