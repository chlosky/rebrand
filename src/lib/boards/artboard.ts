export type BoardOrientation = "portrait" | "landscape";

export type BoardArtboardSize = {
  width: number;
  height: number;
  orientation: BoardOrientation;
};

export const PORTRAIT_ARTBOARD: BoardArtboardSize = {
  width: 1080,
  height: 1350,
  orientation: "portrait",
};

export const LANDSCAPE_ARTBOARD: BoardArtboardSize = {
  width: 1350,
  height: 1080,
  orientation: "landscape",
};

export function artboardSizeForOrientation(
  orientation: BoardOrientation | null | undefined,
): BoardArtboardSize {
  return orientation === "landscape" ? LANDSCAPE_ARTBOARD : PORTRAIT_ARTBOARD;
}

export function inferOrientationFromSize(width: number, height: number): BoardOrientation {
  return width > height ? "landscape" : "portrait";
}

export function readArtboardSizeFromLayoutJson(
  layoutJson: Record<string, unknown> | null | undefined,
  fallbackOrientation: BoardOrientation = "portrait",
): BoardArtboardSize {
  const meta = (layoutJson as Record<string, unknown> | null | undefined)?.__paletteArtboard;

  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const row = meta as Record<string, unknown>;
    const width = typeof row.width === "number" ? row.width : null;
    const height = typeof row.height === "number" ? row.height : null;

    if (width && height && width > 0 && height > 0) {
      return {
        width,
        height,
        orientation: inferOrientationFromSize(width, height),
      };
    }
  }

  return artboardSizeForOrientation(fallbackOrientation);
}

export function withArtboardMeta<T extends Record<string, unknown>>(
  layoutJson: T,
  size: BoardArtboardSize,
): T {
  return {
    ...layoutJson,
    __paletteArtboard: {
      width: size.width,
      height: size.height,
      orientation: size.orientation,
    },
  };
}
