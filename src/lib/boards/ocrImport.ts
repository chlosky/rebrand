export type OcrTextBlock = {
  text: string;
  confidence: number;
  /** Bounding box in source image pixel coordinates */
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type OcrResult = {
  blocks: OcrTextBlock[];
  fullText: string;
};

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: () => {},
      });
      return worker;
    })();
  }
  return workerPromise;
}

function lineBlocks(data: import("tesseract.js").Page): OcrTextBlock[] {
  const out: OcrTextBlock[] = [];
  const lines = data.lines ?? [];
  for (const line of lines) {
    const text = line.text?.trim();
    if (!text || text.length < 2) continue;
    const b = line.bbox;
    if (!b) continue;
    out.push({
      text,
      confidence: line.confidence ?? 0,
      bbox: { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 },
    });
  }
  return out;
}

/** Run OCR on a photo (e.g. physical acrylic board). Lazy-loads Tesseract in the browser. */
export async function recognizeTextFromImage(file: File | Blob): Promise<OcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(file);

  const blocks = lineBlocks(data);
  return {
    blocks: blocks.filter((b) => b.confidence >= 35 || b.text.length > 8),
    fullText: data.text?.trim() ?? "",
  };
}

export type ImagePlacementOnArtboard = {
  offsetX: number;
  offsetY: number;
  scale: number;
  displayWidth: number;
  displayHeight: number;
};

/** Map cover-fit image placement on the 1080×1350 artboard. */
export function computeCoverPlacement(
  imageWidth: number,
  imageHeight: number,
  artboardWidth: number,
  artboardHeight: number,
): ImagePlacementOnArtboard {
  const imgAspect = imageWidth / imageHeight;
  const boardAspect = artboardWidth / artboardHeight;
  if (imgAspect > boardAspect) {
    const displayHeight = artboardHeight;
    const displayWidth = imageWidth * (displayHeight / imageHeight);
    const scale = displayHeight / imageHeight;
    return {
      offsetX: (artboardWidth - displayWidth) / 2,
      offsetY: 0,
      scale,
      displayWidth,
      displayHeight,
    };
  }
  const displayWidth = artboardWidth;
  const displayHeight = imageHeight * (displayWidth / imageWidth);
  const scale = displayWidth / imageWidth;
  return {
    offsetX: 0,
    offsetY: (artboardHeight - displayHeight) / 2,
    scale,
    displayWidth,
    displayHeight,
  };
}

export function mapOcrBlockToCanvas(
  block: OcrTextBlock,
  placement: ImagePlacementOnArtboard,
): { left: number; top: number; fontSize: number } {
  const cx = (block.bbox.x0 + block.bbox.x1) / 2;
  const cy = (block.bbox.y0 + block.bbox.y1) / 2;
  const lineHeight = (block.bbox.y1 - block.bbox.y0) * placement.scale;
  return {
    left: placement.offsetX + cx * placement.scale,
    top: placement.offsetY + cy * placement.scale,
    fontSize: Math.max(14, Math.min(72, lineHeight * 0.85)),
  };
}
