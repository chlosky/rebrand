# Structures code handoff

Reference for **Layouts** (sidebar) and what lands on the canvas.

**Source files:** `BoardPlottingWorkbench.tsx`, `BoardPlotKitTray.tsx`, `BoardCanvasEditor.tsx`, `BoardCompanionPanel.tsx`, `supabase/functions/board-design-chat/index.ts`

---

## Overview

### Interactive vs static

| Layout | Interactive (type rows) | Static (lines only) |
|--------|---------------------------|---------------------|
| Checklist | yes | — |
| Priority grid (`eisenhower`) | yes | — |
| Zones, Timeline, Kanban, Divider | — | yes |

### “Add row” / “Add line”

1. **Priority grid** — `placeInteractivePriority()` draws 6 numbered rows + clickable **`+ add row`** on the canvas.
2. **Checklist** — `placeInteractiveChecklist()` with **`+ add line`** on the canvas.

Both are **on-canvas controls inside a Fabric group**, not sidebar UI. Click the text or press **Enter** while typing a row to append another row.

**Guide chat** does not configure `+ add row` separately. It returns JSON like `{ "type": "add_diagram", "diagram": "eisenhower" }` which calls `addDiagramOverlay("eisenhower")` → `placeInteractivePriority()`.

### Custom props on structure objects

Saved on Fabric objects inside groups (registered in `FabricObject.customProperties` at top of `BoardCanvasEditor.tsx`):

- `structureId` — UUID per dropped layout instance
- `structureType` — `"checklist"` | `"priority"` | …
- `structureRole` — `"checkbox"` | `"label"` | `"priority-left"` | `"priority-right"` | `"add-row"` | `"frame-v"`
- `rowIndex`, `checked` (checklist boxes)

---

## Sidebar layouts (Layouts tab)

**Source:** `src/components/boards/BoardPlottingWorkbench.tsx`  
**Also:** `src/components/boards/BoardPlotKitTray.tsx` (mobile, same `PLOT_STRUCTURES`)

### Layout catalog

```ts
export const PLOT_STRUCTURES = [
  { type: "checklist", title: "Checklist" },
  { type: "divider", title: "Divider" },
  { type: "zones", title: "Zones", items: ["Entry", "Kitchen", "Bedrooms"] },
  { type: "eisenhower", title: "Priority grid" },
  { type: "kanban", title: "Flow columns" },
  { type: "timeline", title: "Timeline" },
];
```

`eisenhower` is the internal type name; the UI label is **Priority grid**.

### Drop placement (normalized 0–1 on artboard)

```ts
export const STRUCTURE_DECAL_SIZE: Record<BoardDiagramType, { x, y, w, h }> = {
  checklist:   { x: 0.14, y: 0.2,  w: 0.62, h: 0.34 },
  divider:     { x: 0.12, y: 0.46, w: 0.76, h: 0.02 },
  zones:       { x: 0.12, y: 0.24, w: 0.68, h: 0.24 },
  eisenhower:  { x: 0.14, y: 0.18, w: 0.62, h: 0.44 },
  kanban:      { x: 0.1,  y: 0.28, w: 0.78, h: 0.18 },
  timeline:    { x: 0.1,  y: 0.34, w: 0.78, h: 0.16 },
  // gantt, okrs, five_s also defined for AI/other callers
};
```

### What happens when user clicks a layout card

```ts
const placeStructure = (type: BoardDiagramType, items?: string[]) => {
  const placement = STRUCTURE_DECAL_SIZE[type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
  editorRef.current?.addDiagramOverlay(type, placement.x, placement.y, placement.w, placement.h, items);
  setOpenTab(null);
};
```

### Sidebar previews (`StructureDecalPreview`)

Small CSS previews on each card only — **not** what appears on the board.

### Layouts vs Marks

- **Layouts** = planning grids via `addDiagramOverlay`
- **Marks** = text, stickies, shapes, stickers, draw via radial menu / marks cards

---

## Interactive checklist

**Source:** `BoardCanvasEditor.tsx` → `placeInteractiveChecklist`, `handleStructurePointer`, `rebindStructureHandlers`

`addDiagramOverlay("checklist", ...)` calls `placeInteractiveChecklist(left, top, width)` and returns early.

### What gets created

- Fabric `Group` with `structureType: "checklist"`
- **4 rows** to start, each row:
  - `Rect` checkbox (`structureRole: "checkbox"`, `evented: true`)
  - `IText` label (`structureRole: "label"`, `editable: true`)
- Bottom: `FabricText` **`+ add line`** (`structureRole: "add-row"`, clickable)

```ts
const STRUCTURE_ROW_H = 38;
const STRUCTURE_BOX = 20;
```

### User interactions

| Action | Handler |
|--------|---------|
| Click checkbox | Toggle fill + label strikethrough |
| Click label text | `enterEditing()` — type item |
| Click `+ add line` | Append new checkbox + empty label row |
| **Enter** while editing label | Exit edit + append row (via `rebindStructureHandlers`) |

### Add row

1. Count existing checkboxes → `rowIndex`
2. `rowTop = 8 + rowIndex * STRUCTURE_ROW_H`
3. `group.add(box, label)`
4. Move `+ add line` down: `top: rowTop + STRUCTURE_ROW_H + 4`
5. `rebindStructureHandlers(canvas)` so Enter works on new label

### Group flags

```ts
subTargetCheck: true,
interactive: true,
objectCaching: false,
```

---

## Interactive priority grid (Eisenhower)

**Source:** `BoardCanvasEditor.tsx` → `placeInteractivePriority`  
**Sidebar type:** `eisenhower` (card title: "Priority grid")  
**Guide AI:** `add_diagram` with `"diagram": "eisenhower"`

### On the board

- Vertical divider at ~55% width (`frame-v`)
- Horizontal header line
- **6 rows**: left cell = item text, right cell = rank number (1–6)
- Bottom: **`+ add row`** (`structureRole: "add-row"`)

Not a classic 2×2 Eisenhower matrix — it's an **item | rank** list layout.

### Entry point

```ts
if (diagram === "eisenhower") {
  placeInteractivePriority(left, top, width);
  return;
}
```

### Structure roles

| Role | Object | Purpose |
|------|--------|---------|
| `frame-v` | `Rect` | Vertical column divider (height grows on add row) |
| `priority-left` | `IText` | Item column, editable |
| `priority-right` | `IText` | Rank column, editable (defaults to row number) |
| `add-row` | `FabricText` | Click to append row |

`structureType` on group: **`"priority"`** (not `"eisenhower"`).

### Add row

- `rowTop = 44 + rowIndex * STRUCTURE_ROW_H`
- Adds `priority-left` + `priority-right` cells
- Extends `frame-v` height
- Moves `+ add row` down

---

## Static diagrams (non-interactive)

**Source:** `BoardCanvasEditor.tsx` → `addDiagramOverlay` branches that build `objects[]` then one `Group`

Decorative scaffolds — lines and labels only, no typing or add-row.

| `diagram` | Default labels | Notes |
|-----------|----------------|-------|
| `zones` | Zone 1–3 or `items` prop | Horizontal zone rows |
| `timeline` | Start, Middle, Milestone, Finish | Axis + tick marks |
| `kanban` | TO DO, IN PROGRESS, DONE | Column dividers |
| `gantt` | Phase 1–3 | Schedule bars |
| `okrs` | Objective + KR 1–3 | Progress lines |
| `five_s` | Sort…Sustain | 5 columns |
| `divider` | — | Single horizontal line (not grouped) |

```ts
const objects: FabricObject[] = [];
// addLine / addText helpers push decal rects and text
const group = new Group(objects, { left, top, subTargetCheck: false, ... });
canvas.add(group);
```

`makeDecalLine` / `makeDecalText` — `evented: false`, not editable.

Checklist and priority bypass the static path:

```ts
if (diagram === "checklist") { placeInteractiveChecklist(...); return; }
if (diagram === "eisenhower") { placeInteractivePriority(...); return; }
```

---

## Pointer handling and reload

**Source:** `BoardCanvasEditor.tsx`

### mouse:down

Only intercepts when `structureRole` is:

```ts
"checkbox" | "add-row" | "label" | "priority-left" | "priority-right"
```

Walks up `target.group` chain, calls `handleStructurePointer(canvas, hit)`. Does not intercept stickies, marks, or static diagrams.

### handleStructurePointer

- `label` / `priority-left` / `priority-right` → `enterEditing` on IText
- `checkbox` → toggle checked + strikethrough label
- `add-row` → run `addRow()` inline

### rebindStructureHandlers

Called after placing checklist/priority, adding a row, `loadFromJSON`, or paste.

Attaches `keydown` on editable structure text: **Enter** → `addRow(structureId, structureType)`.

### On board load

```ts
canvas.loadFromJSON(layoutJson).then(() => {
  canvas.getObjects().forEach((obj) => {
    if (obj instanceof Group && structureProp(obj, "structureId")) {
      obj.set({ subTargetCheck: true, interactive: true, objectCaching: false });
    }
  });
  rebindStructureHandlersRef.current(canvas);
});
```

---

## Guide chat → board

**Client:** `src/components/boards/BoardCompanionPanel.tsx`  
**Server:** `supabase/functions/board-design-chat/index.ts`

### Flow

1. User sends message in Guide tab
2. `POST /functions/v1/board-design-chat` with `board_id`, `message`, `history`
3. OpenAI returns JSON: `{ "reply": "...", "actions": [...] }`
4. `applyActions(actions)` runs each action on the active board editor

### Action types (`applyActions`)

| type | What it does |
|------|----------------|
| `set_color` | `onBoardColorChange(boardId, color_key)` — board background |
| `add_text` | `editor.addTextNormalized(text, x, y, fontSize, color)` |
| `add_sticky` | `editor.addStickyNoteAt(text, x, y, fill)` |
| `add_diagram` | `editor.addDiagramOverlay(diagram, x, y, w, h, items, accent)` |
| `kanban_seed` | `addDiagramOverlay("kanban", ...)` |
| `gantt_seed` | `addDiagramOverlay("gantt", ...)` |

Guide uses the **same code path** as clicking a layout card.

### Chat persistence

- `localStorage` key: `board-companion-chat:${workspaceId}`
- **Clear chat** resets to welcome only

### Auth

Edge function calls `supabase.auth.getUser(token)` with JWT from `Authorization` header. Pro gate: `has_active_plotting_subscription` RPC.

### Example AI response

```json
{
  "reply": "Set coral background, headline, sticky, and priority grid...",
  "actions": [
    { "type": "set_color", "color_key": "orange" },
    { "type": "add_text", "text": "Embrace Joy", "x": 0.5, "y": 0.1 },
    { "type": "add_sticky", "text": "Daily Gratitude", "x": 0.12, "y": 0.35 },
    { "type": "add_diagram", "diagram": "eisenhower", "x": 0.52, "y": 0.2, "w": 0.42, "h": 0.6 }
  ]
}
```

The `add_diagram` action creates the priority grid with `+ add row` — same as the Layouts tab.
