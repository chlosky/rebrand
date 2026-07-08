# Landscape board bug — code dump for ChatGPT

## What's wrong (reported)

On **landscape** board sets (artboard `1350 × 1080`, i.e. wider than tall):

1. **Text has the wrong orientation / shifts.** When placing or editing text on a landscape board, it ends up positioned/oriented wrong — it "does something weird and shifts it."
2. **The usable width is wrong.** The landscape board cuts things off and won't let me put anything on the **sides** — the usable content area is narrower than the visible board, so the left/right edges are unreachable/clipped.

Portrait boards (`1080 × 1350`) work fine. The problem is specific to landscape.

## How boards are sized

- The editor's artboard constants are **portrait** and hard-coded:

```ts
// src/components/boards/BoardCanvasEditor.tsx
export const ARTBOARD_WIDTH = 1080;
export const ARTBOARD_HEIGHT = 1350;
```

- Portrait boards store `artboard_width = 1080, artboard_height = 1350`.
- Landscape boards store `artboard_width = 1350, artboard_height = 1080` (set at "Start new set → Landscape"):

```ts
// src/pages/Workspace.tsx
const LANDSCAPE_ARTBOARD = { width: 1350, height: 1080 };

function templateWithOrientation(
  template: BoardStarterTemplate,
  orientation: NewSetOrientation,
): BoardStarterTemplate {
  if (orientation === "portrait") return template;
  return {
    ...template,
    boards: template.boards.map((board) => ({
      ...board,
      artboard_width: LANDSCAPE_ARTBOARD.width,
      artboard_height: LANDSCAPE_ARTBOARD.height,
    })),
  };
}
```

- Persistence defaults to portrait when a template doesn't specify dims:

```ts
// src/lib/boards/api.ts  (createWorkspaceFromTemplate)
const boardRows = template.boards.map((b) => ({
  workspace_id: workspace.id,
  user_id: userId,
  title: b.title,
  role: b.role,
  color_key: b.color_key,
  sort_order: b.sort_order,
  layout_mode: b.layout_mode ?? "vision",
  artboard_width: b.artboard_width ?? 1080,
  artboard_height: b.artboard_height ?? 1350,
  layout_json: {},
}));
```

## The editor (uses per-board dims via props)

The editor receives `artboardWidth`/`artboardHeight` props and uses them for the Fabric canvas size, fit/zoom, and coordinate math. Callers (`BoardDesktopGrid`, `BoardMobileCarousel`) pass `artboardWidth={board.artboard_width}` / `artboardHeight={board.artboard_height}`.

```ts
// src/components/boards/BoardCanvasEditor.tsx  (props + defaults)
artboardWidth = ARTBOARD_WIDTH,   // defaults to 1080 (portrait) if prop missing
artboardHeight = ARTBOARD_HEIGHT, // defaults to 1350 (portrait) if prop missing
```

```ts
// src/components/boards/BoardCanvasEditor.tsx  (fitCanvas)
const fitCanvas = useCallback((canvas: Canvas) => {
  const container = containerRef.current;
  const wrap = canvasWrapRef.current;
  if (!container) return;
  const pad = embedded ? 0 : 32;
  const maxW = Math.max(container.clientWidth - pad, 1);
  const maxH = Math.max(container.clientHeight - pad, 1);
  const containScale = Math.min(maxW / artboardWidth, maxH / artboardHeight);
  const coverScale = Math.max(maxW / artboardWidth, maxH / artboardHeight);
  const baseScale =
    embedded && cellFit === "cover"
      ? coverScale
      : Math.min(containScale, embedded ? Infinity : 1);
  const zoom =
    viewZoom === "fit"
      ? baseScale > 0 ? baseScale : 0.5
      : typeof viewZoom === "number"
        ? containScale * viewZoom
        : baseScale > 0 ? baseScale : 0.5;
  canvas.setZoom(zoom);
  const scaledW = artboardWidth * zoom;
  const scaledH = artboardHeight * zoom;
  canvas.setDimensions({ width: scaledW, height: scaledH });
  const canvasEl = canvas.getElement();
  if (embedded && cellFit === "cover" && wrap) {
    canvasEl.style.marginLeft = `${(maxW - scaledW) / 2}px`;
    canvasEl.style.marginTop = `${(maxH - scaledH) / 2}px`;
  } else {
    canvasEl.style.marginLeft = "";
    canvasEl.style.marginTop = "";
  }
  canvas.requestRenderAll();
}, [cellFit, embedded, viewZoom]); // <-- NOTE: artboardWidth / artboardHeight are NOT in deps
```

```ts
// src/components/boards/BoardCanvasEditor.tsx  (canvas creation effect start)
useEffect(() => {
  if (!canvasElRef.current) return;
  const bg = boardFillForKey(colorKey);
  const canvas = new Canvas(canvasElRef.current, {
    width: artboardWidth,
    height: artboardHeight,
    backgroundColor: bg,
    selection: !readOnly,
  });
  fabricRef.current = canvas;
  fitCanvas(canvas);
  const onResize = () => fitCanvas(canvas);
  window.addEventListener("resize", onResize);
  // ...ResizeObserver + event handlers...
});
```

Object placement uses the per-board dims (examples):

```ts
// addText
const t = new IText(text, { left: artboardWidth / 2, top: artboardHeight * 0.38, originX: "center", originY: "top", ... });

// pointer -> normalized
normX: Math.min(1, Math.max(0, pointer.x / artboardWidth)),
normY: Math.min(1, Math.max(0, pointer.y / artboardHeight)),

// normalized -> absolute
left: normX * artboardWidth,
top:  normY * artboardHeight,
```

Editor DOM (canvas is wrapped by Fabric's `.canvas-container` inside these):

```tsx
// src/components/boards/BoardCanvasEditor.tsx  (return)
<div ref={containerRef} className={cn("board-artboard-host h-full w-full",
  embedded ? "min-h-0 overflow-hidden p-0" : "flex min-h-[420px] items-center justify-center bg-[#ebe8e3] p-4")}>
  <div ref={canvasWrapRef} className={cn("relative h-full w-full overflow-hidden",
    embedded ? "flex items-start justify-center" : "min-h-[140px] rounded-sm shadow-...")}>
    <canvas ref={canvasElRef} />
    {/* overlays */}
  </div>
</div>
```

## The grid cell sizing (desktop)

```ts
// src/components/boards/BoardDesktopGrid.tsx
const firstBoard = boards[0];
const boardAspectHeight =
  firstBoard && firstBoard.artboard_width > 0
    ? firstBoard.artboard_height / firstBoard.artboard_width
    : ARTBOARD_HEIGHT / ARTBOARD_WIDTH;

// ...
setCellSize({
  width: Math.max(MIN_CELL_WIDTH_PX, Math.round(cellWidth)),
  height: isMatrix
    ? Math.round(cellHeight)
    : Math.max(Math.round(cellWidth * boardAspectHeight), Math.round(cellHeight)),
});
```

`isMatrix` (landscape) is chosen when `artboard_width > artboard_height`:

```ts
// src/pages/features/Boards.tsx
const workspacePresentation = useMemo(() => {
  const firstBoard = workspace?.boards[0];
  return firstBoard && firstBoard.artboard_width > firstBoard.artboard_height ? "matrix" : "row";
}, [workspace?.boards]);
```

## The scaling + export code (HARD-CODED to portrait — prime suspect)

`layoutScale.ts` scales and letterboxes using the **fixed portrait constants**, ignoring the board's real dimensions:

```ts
// src/lib/boards/layoutScale.ts  (FULL)
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";

const NUMERIC_LAYOUT_KEYS = ["left","top","width","height","fontSize","strokeWidth","rx","ry","radius","padding"] as const;

/** Scale Fabric layout JSON from artboard coordinates to a target pixel size. */
export function scaleLayoutJson(
  layoutJson: Record<string, unknown>,
  targetWidth: number,
  targetHeight: number,
): Record<string, unknown> {
  const scaleX = targetWidth / ARTBOARD_WIDTH;   // <-- always /1080
  const scaleY = targetHeight / ARTBOARD_HEIGHT;  // <-- always /1350
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
  return ARTBOARD_WIDTH / ARTBOARD_HEIGHT;  // <-- always 1080/1350 = 0.8 (portrait)
}

/** Fit 4:5 artboard content inside a page box (centered, letterboxed). */
export function fitArtboardInBox(
  pageWidth: number,
  pageHeight: number,
): { x: number; y: number; width: number; height: number } {
  const artAspect = artboardAspectRatio();   // <-- always portrait
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

The export renderer builds the content canvas at the **fixed portrait size** and loads the layout into it, so a landscape board's objects (positioned within `1350 × 1080`) get composited into a `1080 × 1350` canvas — right side is clipped and the aspect is wrong:

```ts
// src/lib/boards/renderBoard.ts  (inside renderBoardToDataUrl / renderBoardToBlob)
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";
import { fitArtboardInBox } from "@/lib/boards/layoutScale";

const contentBox = contentBoxOverride ?? fitArtboardInBox(pageWidthPx, pageHeightPx); // portrait aspect
// ...
const contentCanvas = new StaticCanvas(contentEl, {
  width: ARTBOARD_WIDTH,   // <-- 1080 fixed, even for landscape boards
  height: ARTBOARD_HEIGHT, // <-- 1350 fixed
  backgroundColor: bg,
});
if (hasObjects) {
  await contentCanvas.loadFromJSON(layoutJson);
}
// snapshot is then fit into contentBox on the page canvas
```

```ts
// src/lib/boards/renderBoard.ts  (native artboard render)
export async function renderBoardArtboardDataUrl(layoutJson, colorKey) {
  return renderBoardToDataUrl({
    layoutJson, colorKey,
    pageWidthPx: ARTBOARD_WIDTH,   // <-- fixed portrait
    pageHeightPx: ARTBOARD_HEIGHT, // <-- fixed portrait
    backgroundPageColor: boardFillForKey(colorKey),
  });
}
```

## Suspected root causes

1. **`layoutScale.ts` ignores the board's real artboard size.** `scaleLayoutJson`, `artboardAspectRatio`, and `fitArtboardInBox` are hard-coded to `1080 × 1350`. For a landscape board (`1350 × 1080`) this uses the wrong aspect (0.8 instead of 1.25), so content is scaled/letterboxed for a portrait frame — squished/shifted and clipped on the sides. These functions have no way to receive the board's dims.

2. **`renderBoard.ts` composites into a fixed `1080 × 1350` content canvas.** Landscape objects live in a `1350`-wide space, so anything with `left > 1080` is cut off, and the fitted snapshot uses the portrait `contentBox`. This produces the wrong orientation/clipping on export and on any board-to-board import that uses `renderBoardArtboardDataUrl`.

3. **`fitCanvas` dependency array omits `artboardWidth`/`artboardHeight`** (`[cellFit, embedded, viewZoom]`). If the board's dims change after the callback is memoized (e.g. props arrive/switch), the canvas can be fit using stale dimensions. Also verify the canvas-creation `useEffect` re-runs (or re-sizes) when `artboardWidth`/`artboardHeight` change.

## What I want

Make landscape boards (`1350 × 1080`) behave exactly like portrait, with no special-casing beyond dimensions:

- Text and all objects place/scale/orient correctly on landscape.
- The full width is usable — nothing clipped on the sides; content can go edge to edge.
- Editor selection boxes line up with objects (no offset).
- Export (PDF/PNG/phone) and board-to-board import use the **board's real** `artboard_width`/`artboard_height`, not the fixed `1080 × 1350`.

Constraints:
- Do not break portrait boards.
- Don't stretch/distort content; keep aspect correct per the board's own dimensions.
- Keep the existing per-board `artboard_width`/`artboard_height` data model.
