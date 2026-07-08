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

/** Scale Fabric layout JSON from source artboard coordinates to a target pixel size. */
export function scaleLayoutJson(
  layoutJson: Record<string, unknown>,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): Record<string, unknown> {
  const scaleX = targetWidth / sourceWidth;
  const scaleY = targetHeight / sourceHeight;
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

export function artboardAspectRatio(sourceWidth: number, sourceHeight: number): number {
  return sourceWidth / sourceHeight;
}

/** Fit source artboard content inside a page box (centered, letterboxed). */
export function fitArtboardInBox(
  pageWidth: number,
  pageHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): { x: number; y: number; width: number; height: number } {
  const artAspect = artboardAspectRatio(sourceWidth, sourceHeight);
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
