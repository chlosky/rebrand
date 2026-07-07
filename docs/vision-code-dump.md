# Vision code dump (handoff)

Single-file handoff for the **Vision** page (`/dashboard/boards`). Paste into ChatGPT or another agent.

**Page title:** Vision

**Route:** `/dashboard/boards`

**Test user:** `support@test.com` / `Test!123`

**Layout:** Desktop = left plotting dock + horizontal board grid. Mobile = carousel + bottom plot kit tray.

---

## Route registration

```tsx
// src/App.tsx
import Boards from "./pages/features/Boards";
import BoardAccountability from "./pages/features/BoardAccountability";
// ...
                <Route index element={<Navigate to="/dashboard/boards" replace />} />
                <Route path="boards" element={<Boards />} />
                <Route path="boards/accountability" element={<BoardAccountability />} />
```

## Board types

```ts
// src/lib/boards/types.ts
// NOTE: verbatim copy from the repo at time of export.
export type BoardRole = "focus" | "plan";

export type BoardLayoutMode =
  | "vision"
  | "kanban"
  | "gantt"
  | "eisenhower"
  | "okrs"
  | "five_s"
  | "checklist"
  | "gallery";

export type BoardReminderChannel = "email" | "sms" | "push";

export type BoardReminderSource = "user" | "ai_extracted" | "plan_item";

export type BoardWorkspace = {
  id: string;
  user_id: string;
  name: string;
  preset_slug: string | null;
  created_at: string;
  updated_at: string;
};

export type Board = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  title_color: string | null;
  title_font: string | null;
  role: BoardRole;
  color_key: string;
  sort_order: number;
  layout_json: Record<string, unknown>;
  layout_mode: BoardLayoutMode;
  artboard_width: number;
  artboard_height: number;
  created_at: string;
  updated_at: string;
};

export type BoardReminder = {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  body: string | null;
  remind_at: string;
  timezone: string | null;
  channels: string[];
  source: BoardReminderSource;
  fabric_object_id: string | null;
  status: string;
  ical_uid: string | null;
  last_sent_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type BoardImageAsset = {
  id: string;
  theme: string;
  category: string;
  url: string;
  description: string;
  tags?: string[];
};

export type BoardWorkspaceWithBoards = BoardWorkspace & { boards: Board[] };
```

## Board colors

```ts
// src/lib/boards/colors.ts
// NOTE: verbatim copy from the repo at time of export.
/** Named board colors — templates, AI companion, and legacy rows. */
export type BoardColorKey =
  | "rose_gold"
  | "light_pink"
  | "neon_pink"
  | "sky_blue"
  | "red"
  | "yellow"
  | "green"
  | "light_green"
  | "blue"
  | "orange"
  | "clear"
  | "white_opaque"
  | "black_opaque";

export const BOARD_COLORS: Record<
  BoardColorKey,
  { key: BoardColorKey; label: string; swatch: string; fill: string }
> = {
  rose_gold: { key: "rose_gold", label: "Rose Gold", swatch: "#E8B4B8", fill: "#F5E1E3" },
  light_pink: { key: "light_pink", label: "Light Pink", swatch: "#F8BBD0", fill: "#FDE8F0" },
  neon_pink: { key: "neon_pink", label: "Neon Pink", swatch: "#FF4DA6", fill: "#FFE0F0" },
  sky_blue: { key: "sky_blue", label: "Sky Blue", swatch: "#87CEEB", fill: "#E3F4FC" },
  red: { key: "red", label: "Red", swatch: "#E63946", fill: "#FCE4E6" },
  yellow: { key: "yellow", label: "Yellow", swatch: "#FFD93D", fill: "#FFF8DC" },
  green: { key: "green", label: "Green", swatch: "#3CB371", fill: "#E0F5EA" },
  light_green: { key: "light_green", label: "Light Green", swatch: "#98FB98", fill: "#EDFCEB" },
  blue: { key: "blue", label: "Blue", swatch: "#2563EB", fill: "#E0EBFF" },
  orange: { key: "orange", label: "Orange", swatch: "#FF8C42", fill: "#FFE8D6" },
  clear: { key: "clear", label: "Clear", swatch: "#E8E8E8", fill: "#FAFAFA" },
  white_opaque: { key: "white_opaque", label: "White", swatch: "#F0F0F0", fill: "#FFFFFF" },
  black_opaque: { key: "black_opaque", label: "Black", swatch: "#1C1C1C", fill: "#F5F5F5" },
};

/** Quick picks in the Marks panel — full ROYGBIV plus useful neutrals. */
export const BOARD_QUICK_PICK_COLORS = [
  { label: "Red", hex: "#e53935" },
  { label: "Orange", hex: "#fb8c00" },
  { label: "Yellow", hex: "#fdd835" },
  { label: "Green", hex: "#43a047" },
  { label: "Blue", hex: "#1e88e5" },
  { label: "Indigo", hex: "#3949ab" },
  { label: "Violet", hex: "#8e24aa" },
  { label: "Rose", hex: "#ec407a" },
  { label: "Coral", hex: "#ff7043" },
  { label: "Lime", hex: "#c0ca33" },
  { label: "Teal", hex: "#00897b" },
  { label: "Cyan", hex: "#00acc1" },
  { label: "White", hex: "#ffffff" },
  { label: "Black", hex: "#1C1C1C" },
] as const;

export function normalizeBoardColorHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(withHash)) return null;
  const expanded =
    withHash.length === 4
      ? `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`
      : withHash;
  return expanded.toLowerCase();
}

export function boardFillForKey(key: string): string {
  const hex = normalizeBoardColorHex(key);
  if (hex) return hex;
  const entry = BOARD_COLORS[key as BoardColorKey];
  return entry?.fill.toLowerCase() ?? "#fafafa";
}

export function boardColorHexForKey(key: string): string {
  return boardFillForKey(key);
}
```

## Board API (workspace + uploads)

```ts
// src/lib/boards/api.ts
// NOTE: verbatim copy from the repo at time of export.
import { supabase } from "@/integrations/supabase/client";
import type { Board, BoardReminder, BoardWorkspace, BoardWorkspaceWithBoards } from "@/lib/boards/types";
import {
  buildTemplateFromFocusCategories,
  DEFAULT_FOUR_BOARD_TEMPLATE,
  normalizeFocusCategoryNames,
  resolveBoardStarterTemplate,
  type BoardStarterTemplate,
} from "@/lib/boards/starterTemplates";

export async function fetchUserWorkspaces(userId: string): Promise<BoardWorkspace[]> {
  const { data, error } = await supabase
    .from("board_workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BoardWorkspace[];
}

export async function fetchWorkspaceWithBoards(workspaceId: string): Promise<BoardWorkspaceWithBoards | null> {
  const { data: workspace, error: wErr } = await supabase
    .from("board_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  if (wErr) throw wErr;
  if (!workspace) return null;

  const { data: boards, error: bErr } = await supabase
    .from("boards")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (bErr) throw bErr;

  return { ...(workspace as BoardWorkspace), boards: (boards ?? []) as Board[] };
}

export async function ensureDefaultWorkspace(userId: string): Promise<BoardWorkspaceWithBoards> {
  const existing = await fetchUserWorkspaces(userId);
  if (existing.length > 0) {
    const full = await fetchWorkspaceWithBoards(existing[0].id);
    if (full) return full;
  }
  return createWorkspaceFromTemplate(userId, DEFAULT_FOUR_BOARD_TEMPLATE);
}

/** First entitlement: create a workspace from onboarding rebrand config when none exists. */
export async function ensureStarterWorkspaceFromSlug(
  userId: string,
  templateSlug: string | undefined,
): Promise<BoardWorkspaceWithBoards | null> {
  const existing = await fetchUserWorkspaces(userId);
  if (existing.length > 0) return null;
  const template = resolveBoardStarterTemplate(templateSlug);
  return createWorkspaceFromTemplate(userId, template);
}

/** First entitlement: focus categories from onboarding become the three starter boards plus The Plan. */
export async function ensureStarterWorkspaceFromCategories(
  userId: string,
  categories: string[] | undefined,
): Promise<BoardWorkspaceWithBoards | null> {
  const existing = await fetchUserWorkspaces(userId);
  if (existing.length > 0) return null;
  const valid = normalizeFocusCategoryNames(categories);
  if (valid.length === 0) return null;
  return createWorkspaceFromTemplate(userId, buildTemplateFromFocusCategories(valid));
}

export async function createWorkspaceFromTemplate(
  userId: string,
  template: BoardStarterTemplate,
  name?: string,
): Promise<BoardWorkspaceWithBoards> {
  const { data: workspace, error: wErr } = await supabase
    .from("board_workspaces")
    .insert({
      user_id: userId,
      name: name?.trim() || template.name,
      preset_slug: template.slug,
    })
    .select()
    .single();
  if (wErr) throw wErr;

  const boardRows = template.boards.map((b) => ({
    workspace_id: workspace.id,
    user_id: userId,
    title: b.title,
    role: b.role,
    color_key: b.color_key,
    sort_order: b.sort_order,
    layout_mode: b.layout_mode ?? "vision",
    layout_json: {},
  }));

  const { data: boards, error: bErr } = await supabase.from("boards").insert(boardRows).select();
  if (bErr) throw bErr;

  return { ...(workspace as BoardWorkspace), boards: (boards ?? []) as Board[] };
}

export async function saveBoardLayout(boardId: string, layoutJson: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from("boards")
    .update({ layout_json: layoutJson })
    .eq("id", boardId);
  if (error) throw error;
}

export async function updateBoardMeta(
  boardId: string,
  patch: Partial<Pick<Board, "title" | "title_color" | "title_font" | "color_key" | "sort_order" | "layout_mode">>,
): Promise<void> {
  const { error } = await supabase.from("boards").update(patch).eq("id", boardId);
  if (error) throw error;
}

export async function addBoard(
  workspaceId: string,
  userId: string,
  title: string,
  role: Board["role"],
  sortOrder: number,
): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      title,
      role,
      color_key: role === "plan" ? "white_opaque" : "light_pink",
      sort_order: sortOrder,
      layout_json: {},
    })
    .select()
    .single();
  if (error) throw error;
  return data as Board;
}

export async function reorderBoards(orderedBoardIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedBoardIds.map((id, sort_order) => supabase.from("boards").update({ sort_order }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) throw error;
}

export async function createBoardReminder(
  input: Omit<BoardReminder, "id" | "created_at" | "updated_at" | "last_sent_at" | "ical_uid" | "status"> & {
    status?: string;
    metadata?: Record<string, unknown> | null;
  },
): Promise<BoardReminder> {
  const { data, error } = await supabase.from("board_reminders").insert(input).select().single();
  if (error) throw error;
  return data as BoardReminder;
}

export async function deletePendingActionRemindersForChannel(params: {
  boardId: string;
  userId: string;
  channel: "email" | "sms";
}): Promise<void> {
  const { error } = await supabase
    .from("board_reminders")
    .delete()
    .eq("board_id", params.boardId)
    .eq("user_id", params.userId)
    .eq("source", "ai_extracted")
    .eq("status", "scheduled")
    .contains("channels", [params.channel])
    .filter("metadata->>source_page", "eq", "action");

  if (error) throw error;
}

export async function uploadBoardImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("board-uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: signed, error: signErr } = await supabase.storage
    .from("board-uploads")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signErr) throw signErr;
  return signed.signedUrl;
}

export async function listUserUploads(userId: string): Promise<{ path: string; signedUrl: string }[]> {
  const { data, error } = await supabase.storage.from("board-uploads").list(userId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  const files = data ?? [];
  const out: { path: string; signedUrl: string }[] = [];
  for (const f of files) {
    if (!f.name || f.id === null) continue;
    const path = `${userId}/${f.name}`;
    const { data: signed, error: signErr } = await supabase.storage
      .from("board-uploads")
      .createSignedUrl(path, 60 * 60);
    if (!signErr && signed?.signedUrl) out.push({ path, signedUrl: signed.signedUrl });
  }
  return out;
}
```

## Starter templates

```ts
// src/lib/boards/starterTemplates.ts
// NOTE: verbatim copy from the repo at time of export.
import { FOCUS_CATEGORIES } from "@/lib/focusCategories";
import type { BoardLayoutMode, BoardRole } from "@/lib/boards/types";

export type PrimarySetupIntent =
  | "life_rebranding"
  | "home_organization"
  | "office_work"
  | "moodboarding";

export type StarterBoardDef = {
  title: string;
  role: BoardRole;
  color_key: string;
  sort_order: number;
  layout_mode?: BoardLayoutMode;
};

export type BoardStarterTemplate = {
  slug: string;
  name: string;
  description: string;
  intent: PrimarySetupIntent;
  boards: StarterBoardDef[];
};

/** Standard plot: three focus boards plus The Plan (four boards total). */
export const STANDARD_BOARD_COUNT = 4;

/** Category-driven life rebrand preset — titles come from onboarding selections. */
export const FOUR_BOARD_FOCUS_CATEGORIES_SLUG = "four-board-focus-categories";

const FOCUS_CATEGORY_NAMES = new Set(FOCUS_CATEGORIES.map((c) => c.name));

const FOCUS_BOARD_DEFAULT_COLORS = ["rose_gold", "blue", "light_pink"] as const;
const FOCUS_BOARD_FALLBACK_TITLES = ["Focus Board 1", "Focus Board 2", "Focus Board 3"] as const;

const FOCUS_CATEGORY_COLOR_KEY: Record<string, string> = {
  Identity: "rose_gold",
  "Career & Money": "green",
  "Love & Relationships": "neon_pink",
  "Home & Space": "sky_blue",
  "Beauty & Wellness": "light_pink",
  "Travel & Adventure": "orange",
  "Organization & Plan": "blue",
  "Aesthetic & Mood": "yellow",
  "College & School": "light_green",
  "Health & Fitness": "red",
};

/** Classic four-board plot — life rebranding default. */
export const DEFAULT_FOUR_BOARD_TEMPLATE: BoardStarterTemplate = {
  slug: "four-board-rebrand",
  intent: "life_rebranding",
  name: "Three Focus Boards and The Plan",
  description: "Three focus boards and one plan board — the signature four-board plot.",
  boards: [
    { title: "Focus Board 1", role: "focus", color_key: "rose_gold", sort_order: 0, layout_mode: "vision" },
    { title: "Focus Board 2", role: "focus", color_key: "blue", sort_order: 1, layout_mode: "vision" },
    { title: "Focus Board 3", role: "focus", color_key: "light_pink", sort_order: 2, layout_mode: "vision" },
    { title: "The Plan", role: "plan", color_key: "white_opaque", sort_order: 3, layout_mode: "vision" },
  ],
};

const LIFE_TEMPLATES: BoardStarterTemplate[] = [
  DEFAULT_FOUR_BOARD_TEMPLATE,
  {
    slug: "soft-life-reset",
    intent: "life_rebranding",
    name: "Glow, Home & Peace",
    description: "Three vision boards for beauty, space, and calm — plus your plan.",
    boards: [
      { title: "Glow Up", role: "focus", color_key: "light_pink", sort_order: 0, layout_mode: "vision" },
      { title: "Home & Space", role: "focus", color_key: "sky_blue", sort_order: 1, layout_mode: "vision" },
      { title: "Peace & Rituals", role: "focus", color_key: "light_green", sort_order: 2, layout_mode: "vision" },
      { title: "The Plan", role: "plan", color_key: "white_opaque", sort_order: 3, layout_mode: "vision" },
    ],
  },
  {
    slug: "career-girl",
    intent: "life_rebranding",
    name: "Ambition & Wealth",
    description: "Career, money, and confidence vision boards with a weekly plan.",
    boards: [
      { title: "Career Vision", role: "focus", color_key: "blue", sort_order: 0, layout_mode: "vision" },
      { title: "Money & Abundance", role: "focus", color_key: "green", sort_order: 1, layout_mode: "vision" },
      { title: "Confidence", role: "focus", color_key: "neon_pink", sort_order: 2, layout_mode: "vision" },
      { title: "The Plan", role: "plan", color_key: "white_opaque", sort_order: 3, layout_mode: "vision" },
    ],
  },
  {
    slug: "minimal-plan",
    intent: "life_rebranding",
    name: "One Vision + Plan",
    description: "One hero vision board and a dedicated plan board.",
    boards: [
      { title: "Main Vision", role: "focus", color_key: "yellow", sort_order: 0, layout_mode: "vision" },
      { title: "The Plan", role: "plan", color_key: "white_opaque", sort_order: 1, layout_mode: "vision" },
    ],
  },
];

function homeTemplate(
  slug: string,
  name: string,
  description: string,
  boards: StarterBoardDef[],
): BoardStarterTemplate {
  return { slug, name, description, intent: "home_organization", boards };
}

const HOME_TEMPLATES: BoardStarterTemplate[] = [
  homeTemplate("home-plan-routines", "Home Plan & Routines", "Weekly rhythms, zones, and family flow.", [
    { title: "Weekly Home Plan", role: "plan", color_key: "sky_blue", sort_order: 0, layout_mode: "checklist" },
    { title: "Rooms & Zones", role: "focus", color_key: "light_green", sort_order: 1, layout_mode: "vision" },
    { title: "Routines", role: "focus", color_key: "yellow", sort_order: 2, layout_mode: "checklist" },
    { title: "Family Board", role: "focus", color_key: "light_pink", sort_order: 3, layout_mode: "vision" },
  ]),
  homeTemplate("home-chores-cleaning", "Chores & Cleaning", "Chore charts, supplies, and reset zones.", [
    { title: "Chore Chart", role: "plan", color_key: "green", sort_order: 0, layout_mode: "checklist" },
    { title: "Room Reset", role: "focus", color_key: "sky_blue", sort_order: 1, layout_mode: "checklist" },
    { title: "Supplies", role: "focus", color_key: "yellow", sort_order: 2, layout_mode: "vision" },
    { title: "Deep Clean Plan", role: "focus", color_key: "white_opaque", sort_order: 3, layout_mode: "checklist" },
  ]),
  homeTemplate("home-meal-planning", "Meal Planning", "Menus, groceries, and kitchen rhythm.", [
    { title: "Weekly Menu", role: "plan", color_key: "orange", sort_order: 0, layout_mode: "checklist" },
    { title: "Grocery List", role: "focus", color_key: "green", sort_order: 1, layout_mode: "checklist" },
    { title: "Prep & Freezer", role: "focus", color_key: "sky_blue", sort_order: 2, layout_mode: "vision" },
    { title: "Family Favorites", role: "focus", color_key: "light_pink", sort_order: 3, layout_mode: "gallery" },
  ]),
  homeTemplate("home-family-kids", "Family & Kids", "Schedules, activities, and household command.", [
    { title: "Family Calendar", role: "plan", color_key: "blue", sort_order: 0, layout_mode: "checklist" },
    { title: "Kids Activities", role: "focus", color_key: "neon_pink", sort_order: 1, layout_mode: "vision" },
    { title: "School & Sports", role: "focus", color_key: "yellow", sort_order: 2, layout_mode: "checklist" },
    { title: "Home Command", role: "focus", color_key: "light_green", sort_order: 3, layout_mode: "vision" },
  ]),
  homeTemplate("home-seasonal-reset", "Seasonal Reset", "Holiday, declutter, and seasonal home projects.", [
    { title: "Season Plan", role: "plan", color_key: "rose_gold", sort_order: 0, layout_mode: "checklist" },
    { title: "Declutter Zones", role: "focus", color_key: "white_opaque", sort_order: 1, layout_mode: "checklist" },
    { title: "Decor & Mood", role: "focus", color_key: "light_pink", sort_order: 2, layout_mode: "gallery" },
    { title: "Storage", role: "focus", color_key: "sky_blue", sort_order: 3, layout_mode: "vision" },
  ]),
];

function officeTemplate(
  slug: string,
  name: string,
  description: string,
  primaryTitle: string,
  mode: BoardLayoutMode,
): BoardStarterTemplate {
  return {
    slug,
    name,
    description,
    intent: "office_work",
    boards: [
      { title: primaryTitle, role: "focus", color_key: "blue", sort_order: 0, layout_mode: mode },
      { title: "The Plan", role: "plan", color_key: "white_opaque", sort_order: 1, layout_mode: "vision" },
    ],
  };
}

const OFFICE_TEMPLATES: BoardStarterTemplate[] = [
  officeTemplate(
    "office-kanban",
    "Kanban Flow",
    "Backlog → To Do → Doing → Done with WIP-friendly columns.",
    "Kanban Board",
    "kanban",
  ),
  officeTemplate(
    "office-gantt",
    "Gantt Timeline",
    "Tasks mapped across time — dependencies and milestones.",
    "Project Timeline",
    "gantt",
  ),
  officeTemplate(
    "office-eisenhower",
    "Eisenhower Matrix",
    "Urgent × Important — quadrant planning loved by executives.",
    "Priority Matrix",
    "eisenhower",
  ),
  officeTemplate(
    "office-okrs",
    "OKRs",
    "Objectives with measurable key results — team-ready framing.",
    "OKR Board",
    "okrs",
  ),
  officeTemplate(
    "office-five-s",
    "5S Workplace",
    "Sort, Set, Shine, Standardize, Sustain — lean floor discipline.",
    "5S Audit",
    "five_s",
  ),
];

function moodTemplate(
  slug: string,
  name: string,
  description: string,
  boards: StarterBoardDef[],
): BoardStarterTemplate {
  return { slug, name, description, intent: "moodboarding", boards };
}

const MOODBOARD_TEMPLATES: BoardStarterTemplate[] = [
  moodTemplate("mood-aesthetic-style", "Aesthetic & Style", "Outfits, palettes, and vibe references.", [
    { title: "Style Board", role: "focus", color_key: "neon_pink", sort_order: 0, layout_mode: "gallery" },
    { title: "Color Palette", role: "focus", color_key: "rose_gold", sort_order: 1, layout_mode: "gallery" },
    { title: "Inspo Grid", role: "focus", color_key: "light_pink", sort_order: 2, layout_mode: "gallery" },
    { title: "Mood Notes", role: "plan", color_key: "white_opaque", sort_order: 3, layout_mode: "vision" },
  ]),
  moodTemplate("mood-interiors-space", "Interiors & Space", "Rooms, furniture, and renovation mood.", [
    { title: "Room Inspo", role: "focus", color_key: "sky_blue", sort_order: 0, layout_mode: "gallery" },
    { title: "Furniture", role: "focus", color_key: "yellow", sort_order: 1, layout_mode: "gallery" },
    { title: "Materials", role: "focus", color_key: "white_opaque", sort_order: 2, layout_mode: "gallery" },
    { title: "Renovation Plan", role: "plan", color_key: "green", sort_order: 3, layout_mode: "vision" },
  ]),
  moodTemplate("mood-travel-inspo", "Travel Inspo", "Destinations, stays, and trip aesthetics.", [
    { title: "Destinations", role: "focus", color_key: "blue", sort_order: 0, layout_mode: "gallery" },
    { title: "Stays & Hotels", role: "focus", color_key: "light_pink", sort_order: 1, layout_mode: "gallery" },
    { title: "Packing & Outfits", role: "focus", color_key: "orange", sort_order: 2, layout_mode: "gallery" },
    { title: "Trip Plan", role: "plan", color_key: "white_opaque", sort_order: 3, layout_mode: "vision" },
  ]),
  moodTemplate("mood-events-weddings", "Events & Weddings", "Ceremony, decor, and vendor vision.", [
    { title: "Ceremony Mood", role: "focus", color_key: "rose_gold", sort_order: 0, layout_mode: "gallery" },
    { title: "Decor & Florals", role: "focus", color_key: "light_pink", sort_order: 1, layout_mode: "gallery" },
    { title: "Attire & Beauty", role: "focus", color_key: "neon_pink", sort_order: 2, layout_mode: "gallery" },
    { title: "Event Plan", role: "plan", color_key: "white_opaque", sort_order: 3, layout_mode: "vision" },
  ]),
  moodTemplate("mood-brand-creative", "Brand & Creative", "Logo, typography, and campaign looks.", [
    { title: "Brand Mood", role: "focus", color_key: "black_opaque", sort_order: 0, layout_mode: "gallery" },
    { title: "Typography", role: "focus", color_key: "sky_blue", sort_order: 1, layout_mode: "gallery" },
    { title: "Campaign Inspo", role: "focus", color_key: "yellow", sort_order: 2, layout_mode: "gallery" },
    { title: "Creative Brief", role: "plan", color_key: "white_opaque", sort_order: 3, layout_mode: "vision" },
  ]),
];

export const BOARD_STARTER_TEMPLATES: BoardStarterTemplate[] = [
  ...LIFE_TEMPLATES,
  ...HOME_TEMPLATES,
  ...OFFICE_TEMPLATES,
  ...MOODBOARD_TEMPLATES,
];

/** @deprecated use BOARD_STARTER_TEMPLATES filtered by intent */
export const LIFE_REBRANDING_TEMPLATES = LIFE_TEMPLATES;

export function templatesForIntent(intent: PrimarySetupIntent | undefined): BoardStarterTemplate[] {
  if (!intent) return LIFE_TEMPLATES;
  return BOARD_STARTER_TEMPLATES.filter((t) => t.intent === intent);
}

export function mapFocusCategoryToColorKey(categoryName: string, index: number): string {
  return FOCUS_CATEGORY_COLOR_KEY[categoryName] ?? FOCUS_BOARD_DEFAULT_COLORS[index] ?? "rose_gold";
}

export function normalizeFocusCategoryNames(categories: string[] | undefined): string[] {
  if (!Array.isArray(categories)) return [];
  return categories.filter((c): c is string => typeof c === "string" && FOCUS_CATEGORY_NAMES.has(c)).slice(0, 3);
}

/** Build a four-board workspace from up to three selected focus categories plus The Plan. */
export function buildTemplateFromFocusCategories(categories: string[]): BoardStarterTemplate {
  const valid = normalizeFocusCategoryNames(categories);
  const boards: StarterBoardDef[] = [];
  for (let i = 0; i < 3; i++) {
    boards.push({
      title: valid[i] ?? FOCUS_BOARD_FALLBACK_TITLES[i],
      role: "focus",
      color_key: valid[i] ? mapFocusCategoryToColorKey(valid[i], i) : FOCUS_BOARD_DEFAULT_COLORS[i],
      sort_order: i,
      layout_mode: "vision",
    });
  }
  boards.push({
    title: "The Plan",
    role: "plan",
    color_key: "white_opaque",
    sort_order: 3,
    layout_mode: "vision",
  });
  return {
    slug: FOUR_BOARD_FOCUS_CATEGORIES_SLUG,
    intent: "life_rebranding",
    name: "Three Focus Boards and The Plan",
    description: "Three focus boards from your selected areas plus The Plan.",
    boards,
  };
}

export function resolveBoardStarterTemplate(slug: string | undefined): BoardStarterTemplate {
  const key = (slug || "").trim();
  if (!key || key === FOUR_BOARD_FOCUS_CATEGORIES_SLUG) return DEFAULT_FOUR_BOARD_TEMPLATE;
  return BOARD_STARTER_TEMPLATES.find((t) => t.slug === key) ?? DEFAULT_FOUR_BOARD_TEMPLATE;
}

export const HOME_FOCUS_TO_TEMPLATE: Record<string, string> = {
  home_plan_routines: "home-plan-routines",
  home_chores_cleaning: "home-chores-cleaning",
  home_meal_planning: "home-meal-planning",
  home_family_kids: "home-family-kids",
  home_seasonal_reset: "home-seasonal-reset",
};

export const MOODBOARD_FOCUS_TO_TEMPLATE: Record<string, string> = {
  mood_aesthetic_style: "mood-aesthetic-style",
  mood_interiors_space: "mood-interiors-space",
  mood_travel_inspo: "mood-travel-inspo",
  mood_events_weddings: "mood-events-weddings",
  mood_brand_creative: "mood-brand-creative",
};

export const OFFICE_SYSTEM_TO_TEMPLATE: Record<string, string> = {
  kanban: "office-kanban",
  gantt: "office-gantt",
  eisenhower: "office-eisenhower",
  okrs: "office-okrs",
  five_s: "office-five-s",
};
```

## Layout scale

```ts
// src/lib/boards/layoutScale.ts
// NOTE: verbatim copy from the repo at time of export.
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

## Render + print export

```ts
// src/lib/boards/renderBoard.ts
// NOTE: verbatim copy from the repo at time of export.
import { StaticCanvas, FabricImage } from "fabric";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";
import { boardFillForKey } from "@/lib/boards/colors";
import { fitArtboardInBox } from "@/lib/boards/layoutScale";

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
  pdf.save(`palette-plot-${slug}-${preset.id}.pdf`);
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

## Save board image

```ts
// src/lib/boards/saveBoardImage.ts
// NOTE: verbatim copy from the repo at time of export.
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

## Image library

```ts
// src/lib/boards/imageLibrary.ts
// NOTE: verbatim copy from the repo at time of export.
import type { BoardImageAsset } from "@/lib/boards/types";

export const BOARD_IMAGE_THEMES = [
  "Identity",
  "Career & Money",
  "Love & Relationships",
  "Home & Space",
  "Beauty & Wellness",
  "Travel & Adventure",
  "Organization & Plan",
  "Aesthetic & Mood",
] as const;

export type BoardImageTheme = (typeof BOARD_IMAGE_THEMES)[number];

let cachedManifest: BoardImageAsset[] | null = null;

export function getCachedBoardImageLibrary(): BoardImageAsset[] | null {
  return cachedManifest;
}

export async function loadBoardImageLibrary(): Promise<BoardImageAsset[]> {
  if (cachedManifest) return cachedManifest;

  const response = await fetch("/boardimagelibrary/manifest.generated.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load board image library");
  }
  const manifest = await response.json();
  cachedManifest = (manifest.images ?? []) as BoardImageAsset[];
  return cachedManifest;
}

export function themesFromLibrary(images: BoardImageAsset[]): BoardImageTheme[] {
  const set = new Set(images.map((i) => i.theme as BoardImageTheme));
  return BOARD_IMAGE_THEMES.filter((t) => set.has(t));
}

export function filterLibraryByTheme(images: BoardImageAsset[], theme: string | null): BoardImageAsset[] {
  if (!theme) return images;
  return images.filter((i) => i.theme === theme);
}
```

## Page shell

```tsx
// src/pages/features/Boards.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CopyPlus, Download, LayoutGrid, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoardToolbar, type BoardZoomPreset } from "@/components/boards/BoardToolbar";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { BoardDesktopGrid } from "@/components/boards/BoardDesktopGrid";
import { BoardPlottingWorkbench } from "@/components/boards/BoardPlottingWorkbench";
import { BoardPlotKitTray } from "@/components/boards/BoardPlotKitTray";
import { BoardMobileCarousel } from "@/components/boards/BoardMobileCarousel";
import {
  addBoard,
  deleteBoard,
  ensureDefaultWorkspace,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
  reorderBoards,
  saveBoardLayout,
  updateBoardMeta,
} from "@/lib/boards/api";
import type { BoardWorkspaceWithBoards } from "@/lib/boards/types";
import { BoardPrintDialog } from "@/components/boards/BoardPrintDialog";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import "@/styles/board-editor.css";

export default function Boards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceParam = searchParams.get("workspace");
  const isMobile = useIsMobile();
  const editorMapRef = useRef(new Map<string, BoardCanvasHandle>());
  const activeEditorRef = useRef<BoardCanvasHandle | null>(null);
  const saveSeqRef = useRef(new Map<string, number>());
  const [imagePickOpen, setImagePickOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<BoardWorkspaceWithBoards | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [boardZoom, setBoardZoom] = useState<BoardZoomPreset>("fit");
  const [undoRedo, setUndoRedo] = useState({ canUndo: false, canRedo: false });

  const handleHistoryChange = useCallback((state: { canUndo: boolean; canRedo: boolean }) => {
    setUndoRedo((prev) =>
      prev.canUndo === state.canUndo && prev.canRedo === state.canRedo ? prev : state,
    );
  }, []);

  const syncUndoRedoFromEditor = useCallback((handle: BoardCanvasHandle | null) => {
    setUndoRedo((prev) => {
      const canUndo = handle?.canUndo() ?? false;
      const canRedo = handle?.canRedo() ?? false;
      if (prev.canUndo === canUndo && prev.canRedo === canRedo) return prev;
      return { canUndo, canRedo };
    });
  }, []);

  const activeBoardIdRef = useRef(activeBoardId);
  activeBoardIdRef.current = activeBoardId;

  const selectBoard = useCallback(
    (id: string) => {
      setActiveBoardId(id);
      const handle = editorMapRef.current.get(id) ?? null;
      activeEditorRef.current = handle;
      syncUndoRedoFromEditor(handle);
    },
    [syncUndoRedoFromEditor],
  );

  const registerEditor = useCallback((boardId: string, handle: BoardCanvasHandle | null) => {
    if (handle) editorMapRef.current.set(boardId, handle);
    else editorMapRef.current.delete(boardId);
    if (boardId === activeBoardIdRef.current) {
      activeEditorRef.current = handle;
    }
  }, []);

  useEffect(() => {
    if (!activeBoardId) return;
    const handle = editorMapRef.current.get(activeBoardId) ?? null;
    activeEditorRef.current = handle;
    syncUndoRedoFromEditor(handle);
  }, [activeBoardId, syncUndoRedoFromEditor]);

  const activeBoard = useMemo(
    () => workspace?.boards.find((b) => b.id === activeBoardId) ?? workspace?.boards[0] ?? null,
    [workspace, activeBoardId],
  );

  const loadWorkspace = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const workspaces = await fetchUserWorkspaces(user.id);
      let full: BoardWorkspaceWithBoards | null = null;
      if (workspaceParam) {
        full = await fetchWorkspaceWithBoards(workspaceParam);
      } else if (workspaces.length === 0) {
        full = await ensureDefaultWorkspace(user.id);
      } else {
        full = await fetchWorkspaceWithBoards(workspaces[0].id);
      }
      if (!full) throw new Error("workspace missing");
      setWorkspace(full);
      setActiveBoardId((prev) => {
        const nextId =
          prev && full.boards.some((b) => b.id === prev) ? prev : full.boards[0]?.id ?? null;
        if (nextId) activeEditorRef.current = editorMapRef.current.get(nextId) ?? null;
        return nextId;
      });
    } catch {
      toast.error("Could not load your boards");
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspaceParam]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    document.title = "Vision | Palette Plotting";
  }, []);

  const handleSaveLayoutFor = useCallback(async (boardId: string, layout: Record<string, unknown>) => {
    const seq = (saveSeqRef.current.get(boardId) ?? 0) + 1;
    saveSeqRef.current.set(boardId, seq);
    try {
      await saveBoardLayout(boardId, layout);
      if (saveSeqRef.current.get(boardId) !== seq) return;
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boards: prev.boards.map((b) => (b.id === boardId ? { ...b, layout_json: layout } : b)),
        };
      });
    } catch {
      if (saveSeqRef.current.get(boardId) !== seq) return;
      toast.error("Could not save board");
    }
  }, []);

  const handleBoardColorFromAi = useCallback(async (boardId: string, colorKey: string) => {
    try {
      await updateBoardMeta(boardId, { color_key: colorKey });
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boards: prev.boards.map((b) => (b.id === boardId ? { ...b, color_key: colorKey } : b)),
        };
      });
    } catch {
      toast.error("Could not update board color");
    }
  }, []);

  const handleRenameBoard = useCallback(async (boardId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await updateBoardMeta(boardId, { title: trimmed });
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boards: prev.boards.map((b) => (b.id === boardId ? { ...b, title: trimmed } : b)),
        };
      });
    } catch {
      toast.error("Could not rename board");
    }
  }, []);

  const handleTitleStyleChange = useCallback(
    async (boardId: string, patch: { title_color?: string | null; title_font?: string | null }) => {
      try {
        await updateBoardMeta(boardId, patch);
        setWorkspace((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            boards: prev.boards.map((b) => (b.id === boardId ? { ...b, ...patch } : b)),
          };
        });
      } catch {
        toast.error("Could not update title style");
      }
    },
    [],
  );

  const handlePickImage = useCallback(async (url: string) => {
    try {
      await activeEditorRef.current?.addImageFromUrl(url);
    } catch {
      toast.error("Could not add image");
    }
  }, []);

  const openQuickImagePicker = useCallback(() => {
    setImagePickOpen(true);
  }, []);

  const handleAddBoard = async () => {
    if (!workspace || !user?.id) return;
    const focusCount = workspace.boards.filter((b) => b.role === "focus").length;
    const n = workspace.boards.length;
    try {
      const board = await addBoard(
        workspace.id,
        user.id,
        `Focus Board ${focusCount + 1}`,
        "focus",
        n,
      );
      setWorkspace({ ...workspace, boards: [...workspace.boards, board] });
      selectBoard(board.id);
      toast.success("Focus board added");
    } catch {
      toast.error("Could not add board");
    }
  };

  const handleDuplicateBoard = async () => {
    if (!workspace || !activeBoard || !user?.id) return;
    const layout =
      editorMapRef.current.get(activeBoard.id)?.getLayoutJson() ?? activeBoard.layout_json;
    const baseTitle = activeBoard.title.replace(/ \(copy( \d+)?\)$/i, "");
    const title = `${baseTitle} (copy)`;
    try {
      const board = await addBoard(
        workspace.id,
        user.id,
        title,
        "focus",
        workspace.boards.length,
      );
      await saveBoardLayout(board.id, layout);
      await updateBoardMeta(board.id, {
        color_key: activeBoard.color_key,
        title_color: activeBoard.title_color,
        title_font: activeBoard.title_font,
        layout_mode: activeBoard.layout_mode,
      });
      const duplicated: typeof board = {
        ...board,
        layout_json: layout,
        color_key: activeBoard.color_key,
        title_color: activeBoard.title_color,
        title_font: activeBoard.title_font,
        layout_mode: activeBoard.layout_mode,
      };
      setWorkspace({ ...workspace, boards: [...workspace.boards, duplicated] });
      selectBoard(board.id);
      toast.success("Board duplicated");
    } catch {
      toast.error("Could not duplicate board");
    }
  };

  const handleReorderBoards = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!workspace) return;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= workspace.boards.length || toIndex >= workspace.boards.length) return;

      const prev = workspace.boards;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const withOrder = next.map((b, i) => ({ ...b, sort_order: i }));

      setWorkspace({ ...workspace, boards: withOrder });
      try {
        await reorderBoards(withOrder.map((b) => b.id));
      } catch {
        setWorkspace({ ...workspace, boards: prev });
        toast.error("Could not reorder boards");
      }
    },
    [workspace],
  );

  const handleMoveBoard = useCallback(
    (boardId: string, direction: -1 | 1) => {
      if (!workspace) return;
      const fromIndex = workspace.boards.findIndex((b) => b.id === boardId);
      if (fromIndex < 0) return;
      void handleReorderBoards(fromIndex, fromIndex + direction);
    },
    [handleReorderBoards, workspace],
  );

  const handleRemoveBoard = async () => {
    if (!workspace || !activeBoard) return;
    if (activeBoard.role === "plan") {
      toast.message("The Plan stays in every workspace");
      return;
    }
    const label = activeBoard.title;
    if (!window.confirm(`Remove “${label}” from your workspace? This cannot be undone.`)) return;
    try {
      await deleteBoard(activeBoard.id);
      const next = workspace.boards.filter((b) => b.id !== activeBoard.id);
      setWorkspace({ ...workspace, boards: next });
      selectBoard(next[0]?.id ?? "");
      toast.success("Board removed");
    } catch {
      toast.error("Could not remove board");
    }
  };

  if (!user) return null;

  const boards = workspace?.boards ?? [];
  const canRemoveBoard = activeBoard?.role !== "plan";

  return (
    <div className="flex h-screen overflow-hidden bg-[#ebe8e3]">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            {isMobile && <MobilePWAMenu />}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/workspace")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <LayoutGrid className="h-5 w-5 text-neutral-700" />
            <div>
              <h1 className="text-sm font-semibold text-neutral-900">Vision</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddBoard}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add board</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => void handleDuplicateBoard()}>
              <CopyPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </Button>
            {canRemoveBoard && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleRemoveBoard}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Remove</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setDownloadOpen(true)}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <div className="ml-1 flex items-center gap-2 border-l border-neutral-200 pl-2">
              <ListChecks className="h-5 w-5 shrink-0 text-neutral-700" />
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Action</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/dashboard/boards/accountability")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {!loading && workspace && activeBoard && (
          <BoardToolbar
            editorRef={activeEditorRef}
            onResetBoard={() => {
              const id = activeBoard.id;
              editorMapRef.current.get(id)?.resetBoard();
            }}
            orientation="horizontal"
            className="shrink-0"
            zoomPreset={!isMobile ? boardZoom : undefined}
            onZoomPresetChange={!isMobile ? setBoardZoom : undefined}
            canUndo={undoRedo.canUndo}
            canRedo={undoRedo.canRedo}
          />
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : !workspace || !activeBoard ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : isMobile ? (
          <div className="flex min-h-0 flex-1 flex-col pb-[4.25rem]">
            <BoardMobileCarousel
              boards={boards}
              activeId={activeBoard.id}
              onSelect={selectBoard}
              onSave={handleSaveLayoutFor}
              onAddBoard={handleAddBoard}
              onRemoveBoard={handleRemoveBoard}
              canRemoveBoard={canRemoveBoard}
              registerEditor={registerEditor}
              onRenameBoard={handleRenameBoard}
              onTitleStyleChange={handleTitleStyleChange}
              onHistoryChange={handleHistoryChange}
              onBoardColorChange={handleBoardColorFromAi}
              onRequestImagePick={openQuickImagePicker}
              onMoveBoard={boards.length > 1 ? handleMoveBoard : undefined}
            />
            <BoardPlotKitTray
              workspaceId={workspace.id}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
            <BoardPlottingWorkbench
              workspaceId={workspace.id}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <BoardDesktopGrid
                boards={boards}
                activeId={activeBoard.id}
                onSelect={selectBoard}
                onSave={handleSaveLayoutFor}
                registerEditor={registerEditor}
                onAddBoard={handleAddBoard}
                onRenameBoard={handleRenameBoard}
                onTitleStyleChange={handleTitleStyleChange}
                zoomPreset={boardZoom}
                onHistoryChange={handleHistoryChange}
                onReorderBoards={boards.length > 1 ? handleReorderBoards : undefined}
              />
            </div>
          </div>
        )}

        {activeBoard && workspace && (
          <>
            <Sheet open={imagePickOpen} onOpenChange={setImagePickOpen}>
              <SheetContent side="bottom" className="h-[min(72vh,520px)] rounded-t-2xl p-0">
                <SheetHeader className="border-b px-4 py-3 text-left">
                  <SheetTitle className="font-welcome-serif text-base font-normal">Pick an image</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(min(72vh,520px)-3.25rem)]">
                  <BoardImagePicker
                    embedded
                    userId={user.id}
                    onPickImage={(url) => {
                      void handlePickImage(url).then(() => {
                        setImagePickOpen(false);
                        toast.success("Image added to board");
                      });
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
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
          </>
        )}
      </div>
    </div>
  );
}
```

## Toolbar

```tsx
// src/components/boards/BoardToolbar.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useState } from "react";
import {
  Layers,
  Redo2,
  RotateCcw,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";

export type BoardZoomPreset = "fit" | 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5;

type BoardToolbarProps = {
  editorRef: React.RefObject<BoardCanvasHandle | null>;
  onResetBoard?: () => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
  zoomPreset?: BoardZoomPreset;
  onZoomPresetChange?: (preset: BoardZoomPreset) => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

const toolBtn =
  "h-9 justify-start gap-2 rounded-lg px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-100";

export function BoardToolbar({
  editorRef,
  onResetBoard,
  className,
  orientation = "vertical",
  zoomPreset,
  onZoomPresetChange,
  canUndo = false,
  canRedo = false,
}: BoardToolbarProps) {
  const horizontal = orientation === "horizontal";
  const showZoom = horizontal && zoomPreset !== undefined && onZoomPresetChange !== undefined;
  const [resetOpen, setResetOpen] = useState(false);

  const runReset = () => {
    if (onResetBoard) onResetBoard();
    else editorRef.current?.resetBoard();
    setResetOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "shrink-0 gap-1 bg-white p-2",
          horizontal
            ? "flex flex-row flex-wrap items-center border-b border-neutral-200"
            : "flex flex-col border-r border-neutral-200",
          className,
        )}
      >
        {!horizontal && (
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Add</p>
        )}
        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          onClick={() => editorRef.current?.addText()}
        >
          <Type className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Text</span> : "Text"}
        </Button>
        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          onClick={() => editorRef.current?.addStickyNote()}
        >
          <StickyNote className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Note</span> : "Sticky note"}
        </Button>

        {horizontal && <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />}

        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          disabled={!canUndo}
          onClick={() => editorRef.current?.undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Undo</span> : "Undo"}
        </Button>
        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          disabled={!canRedo}
          onClick={() => editorRef.current?.redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Redo</span> : "Redo"}
        </Button>

        {horizontal && <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />}

        <Button
          variant="ghost"
          className={cn(
            toolBtn,
            horizontal ? "h-9 w-auto text-amber-800 hover:bg-amber-50 hover:text-amber-900" : "w-full text-amber-800 hover:bg-amber-50 hover:text-amber-900",
          )}
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw className="h-4 w-4" />
          {horizontal ? "Reset board" : "Reset board"}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            toolBtn,
            horizontal ? "h-9 w-auto text-red-600 hover:text-red-700 hover:bg-red-50" : "w-full text-red-600 hover:text-red-700 hover:bg-red-50",
          )}
          onClick={() => editorRef.current?.deleteSelected()}
        >
          <Trash2 className="h-4 w-4" />
          {horizontal ? "Delete" : "Delete selected"}
        </Button>

        {!horizontal && (
          <div className="mt-auto flex items-center gap-1 px-2 pt-4 text-[10px] text-neutral-400">
            <Layers className="h-3 w-3" />
            Right-click menu · Ctrl+C/V · Delete
          </div>
        )}

        {showZoom && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <span className="mr-1 hidden h-6 w-px bg-neutral-200 md:block" aria-hidden />
            <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500">Zoom</span>
              {(
                [
                  { id: "fit" as const, label: "Fit all" },
                  { id: 0.25 as const, label: "25%" },
                  { id: 0.5 as const, label: "50%" },
                  { id: 0.75 as const, label: "75%" },
                  { id: 1 as const, label: "100%" },
                  { id: 1.25 as const, label: "125%" },
                  { id: 1.5 as const, label: "150%" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() => onZoomPresetChange(id)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-medium",
                    zoomPreset === id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                title="Zoom out"
                onClick={() =>
                  onZoomPresetChange(
                    zoomPreset === 1.5
                      ? 1.25
                      : zoomPreset === 1.25
                        ? 1
                        : zoomPreset === 1
                          ? 0.75
                          : zoomPreset === 0.75
                            ? 0.5
                            : zoomPreset === 0.5
                              ? 0.25
                              : zoomPreset === 0.25
                                ? "fit"
                                : "fit",
                  )
                }
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Zoom in"
                onClick={() =>
                  onZoomPresetChange(
                    zoomPreset === "fit"
                      ? 1
                      : zoomPreset === 0.25
                        ? 0.5
                        : zoomPreset === 0.5
                          ? 0.75
                          : zoomPreset === 0.75
                            ? 1
                            : zoomPreset === 1
                              ? 1.25
                              : zoomPreset === 1.25
                                ? 1.5
                                : 1.5,
                  )
                }
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
        )}
        {horizontal && !showZoom && (
          <span className="ml-auto hidden text-[10px] text-neutral-400 sm:inline">
            Right-click menu · Ctrl+C/V
          </span>
        )}
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this board?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all text, images, stickies, and structures from the board. Your board color stays the same.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={runReset}>
              Reset board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

## Canvas editor (Fabric)

```tsx
// src/components/boards/BoardCanvasEditor.tsx
// NOTE: verbatim copy from the repo at time of export.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas, Circle, FabricImage, FabricObject, FabricText, Group, IText, Line, Path, PencilBrush, Polygon, Rect, StaticCanvas, Textbox, Triangle, ActiveSelection, type FabricObject as FabricObjectType } from "fabric";
import { BOARD_QUICK_PICK_COLORS, boardFillForKey } from "@/lib/boards/colors";
import type { BoardLayoutMode } from "@/lib/boards/types";
import { cn } from "@/lib/utils";
import {
  BoardMarksQuickSelector,
  BOARD_MARK_STICKER_EMOJI,
  type BoardMarksQuickAction,
  type BoardMarkShapeType,
  type BoardMarkStickerId,
  type BoardMarkTextSize,
} from "@/components/boards/BoardMarksQuickSelector";

export const ARTBOARD_WIDTH = 1080;
export const ARTBOARD_HEIGHT = 1350;

const DECAL_INK = "#111111";
const DECAL_MUTED = "rgba(17,17,17,0.58)";
const DECAL_LINE = "rgba(17,17,17,0.82)";

let boardObjectClipboard: Record<string, unknown>[] | null = null;

const STRUCTURE_ROW_H = 38;
const STRUCTURE_BOX = 20;
const STRUCTURE_FONT = "system-ui, sans-serif";

const MARK_TEXT_SIZES: Record<BoardMarkTextSize, number> = {
  S: 16,
  M: 22,
  L: 32,
  XL: 42,
};

const MARK_TEXT_FILL = "#000000";
const MARK_SHAPE_STROKE = "#111111";
const MARK_DRAW_WIDTH = 4;

for (const prop of [
  "structureId",
  "structureType",
  "structureRole",
  "structureWidth",
  "rowIndex",
  "columnIndex",
  "itemIndex",
  "checked",
  "markKind",
  "shapeType",
  "stickerId",
] as const) {
  if (!FabricObject.customProperties.includes(prop)) {
    FabricObject.customProperties.push(prop);
  }
}

function structureProp(obj: FabricObjectType, key: string): unknown {
  return typeof obj.get === "function" ? obj.get(key) : undefined;
}

function walkStructureObjects(canvas: Canvas, visit: (obj: FabricObjectType) => void) {
  const step = (obj: FabricObjectType) => {
    visit(obj);
    if (obj instanceof Group) {
      for (const child of obj.getObjects()) step(child);
    }
  };
  for (const obj of canvas.getObjects()) step(obj);
}

function findStructureGroup(canvas: Canvas, structureId: string, structureType: string): Group | null {
  const found = canvas.getObjects().find(
    (o) =>
      o instanceof Group &&
      structureProp(o, "structureId") === structureId &&
      structureProp(o, "structureType") === structureType,
  );
  return found instanceof Group ? found : null;
}

function getStructureLayoutWidth(group: Group): number {
  const stored = structureProp(group, "structureWidth");
  if (typeof stored === "number" && stored > 0) return stored;
  return Math.max(group.width ?? 300, 200);
}

function restoreStructureGroupState(group: Group) {
  group.set({ subTargetCheck: true, interactive: true, objectCaching: false });
  const structureType = structureProp(group, "structureType");
  if (structureType === "checklist") {
    for (const child of group.getObjects()) {
      if (structureProp(child, "structureRole") === "checkbox" && child instanceof Rect) {
        const checked = !!structureProp(child, "checked");
        child.set({ fill: checked ? DECAL_INK : "transparent" });
        const rowIndex = structureProp(child, "rowIndex");
        const label = group
          .getObjects()
          .find(
            (o) =>
              structureProp(o, "structureRole") === "label" && structureProp(o, "rowIndex") === rowIndex,
          );
        if (label instanceof IText) {
          label.set({ linethrough: checked, fill: checked ? DECAL_MUTED : DECAL_INK });
        }
      }
    }
  }
  if (structureType === "checklist" || structureType === "priority") {
    reflowInteractiveStructure(group);
  }
}

function normalizeInteractiveStructureResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const newWidth = getStructureLayoutWidth(group) * sx;

  for (const child of group.getObjects()) {
    const csx = child.scaleX ?? 1;
    const csy = child.scaleY ?? 1;
    if (child instanceof IText) {
      if (csx !== 1 || csy !== 1) {
        child.set({ fontSize: (child.fontSize ?? 18) * csy, scaleX: 1, scaleY: 1 });
      }
    } else if (child instanceof FabricText) {
      if (csx !== 1 || csy !== 1) {
        child.set({ fontSize: (child.fontSize ?? 14) * csy, scaleX: 1, scaleY: 1 });
      }
    } else if (child instanceof Rect) {
      const role = structureProp(child, "structureRole");
      if (role === "checkbox") {
        child.set({ width: STRUCTURE_BOX, height: STRUCTURE_BOX, scaleX: 1, scaleY: 1 });
      } else if (role === "frame-v") {
        child.set({ scaleX: 1, scaleY: 1 });
      } else {
        child.set({
          width: (child.width ?? 0) * csx,
          height: (child.height ?? 0) * csy,
          scaleX: 1,
          scaleY: 1,
        });
      }
    }
  }

  group.set({ scaleX: 1, scaleY: 1, structureWidth: newWidth });
}

function reflowInteractiveStructure(group: Group) {
  const structureType = structureProp(group, "structureType") as string | undefined;
  const width = getStructureLayoutWidth(group);

  if (structureType === "checklist") {
    const boxes = group
      .getObjects()
      .filter((o) => structureProp(o, "structureRole") === "checkbox")
      .sort((a, b) => (structureProp(a, "rowIndex") as number) - (structureProp(b, "rowIndex") as number));

    for (const box of boxes) {
      if (!(box instanceof Rect)) continue;
      const rowIndex = structureProp(box, "rowIndex") as number;
      const rowTop = 8 + rowIndex * STRUCTURE_ROW_H;
      const checked = !!structureProp(box, "checked");
      box.set({ left: 0, top: rowTop, width: STRUCTURE_BOX, height: STRUCTURE_BOX, scaleX: 1, scaleY: 1 });
      box.set({ fill: checked ? DECAL_INK : "transparent" });

      const label = group
        .getObjects()
        .find(
          (o) =>
            structureProp(o, "structureRole") === "label" && structureProp(o, "rowIndex") === rowIndex,
        );
      if (label instanceof IText) {
        label.set({
          left: STRUCTURE_BOX + 10,
          top: rowTop - 2,
          width: width - STRUCTURE_BOX - 24,
          scaleX: 1,
          scaleY: 1,
          linethrough: checked,
          fill: checked ? DECAL_MUTED : DECAL_INK,
        });
      }
    }

    const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
    if (addBtn) {
      addBtn.set({ top: 8 + boxes.length * STRUCTURE_ROW_H + 4, scaleX: 1, scaleY: 1 });
    }
  }

  if (structureType === "priority") {
    const midX = width * 0.55;
    const leftCells = group
      .getObjects()
      .filter((o) => structureProp(o, "structureRole") === "priority-left")
      .sort((a, b) => (structureProp(a, "rowIndex") as number) - (structureProp(b, "rowIndex") as number));
    const rowCount = leftCells.length;

    const headerLine = group
      .getObjects()
      .find((o) => o instanceof Rect && !structureProp(o, "structureRole") && (o.top ?? 0) <= 34);
    if (headerLine instanceof Rect) {
      headerLine.set({ width, scaleX: 1, scaleY: 1 });
    }

    const lastRowTop = 44 + Math.max(0, rowCount - 1) * STRUCTURE_ROW_H;
    const frameV = group.getObjects().find((o) => structureProp(o, "structureRole") === "frame-v");
    if (frameV instanceof Rect) {
      frameV.set({ left: midX, height: lastRowTop + STRUCTURE_ROW_H + 28, scaleX: 1, scaleY: 1 });
    }

    for (const left of leftCells) {
      if (!(left instanceof IText)) continue;
      const rowIndex = structureProp(left, "rowIndex") as number;
      const rowTop = 44 + rowIndex * STRUCTURE_ROW_H;
      left.set({ left: 8, top: rowTop, width: midX - 20, scaleX: 1, scaleY: 1 });

      const right = group
        .getObjects()
        .find(
          (o) =>
            structureProp(o, "structureRole") === "priority-right" &&
            structureProp(o, "rowIndex") === rowIndex,
        );
      if (right instanceof IText) {
        right.set({ left: midX + 8, top: rowTop, width: width - midX - 16, scaleX: 1, scaleY: 1 });
      }
    }

    const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
    if (addBtn) {
      addBtn.set({ top: 44 + rowCount * STRUCTURE_ROW_H + 6, scaleX: 1, scaleY: 1 });
    }
  }

  group.set({ structureWidth: width });
  group.setCoords();
}

const makeDecalLine = (
  left: number,
  top: number,
  width: number,
  height = 3,
  fill = DECAL_LINE,
) =>
  new Rect({
    left,
    top,
    width,
    height,
    fill,
    rx: height / 2,
    ry: height / 2,
    selectable: false,
    evented: false,
  });

const makeDecalText = (
  text: string,
  left: number,
  top: number,
  fontSize = 24,
  fill = DECAL_INK,
  fontWeight: string | number = 700,
) =>
  new FabricText(text.toUpperCase(), {
    left,
    top,
    fontSize,
    fontFamily: "system-ui, sans-serif",
    fill,
    fontWeight,
    selectable: false,
    evented: false,
  });

export type BoardDiagramType =
  | "eisenhower"
  | "checklist"
  | "zones"
  | "timeline"
  | "kanban"
  | "gantt"
  | "okrs"
  | "five_s"
  | "divider";

export type BoardCanvasHandle = {
  addText: (text?: string) => void;
  addTextAt: (text: string, left: number, top: number, fontSize?: number) => void;
  addTextNormalized: (text: string, x: number, y: number, fontSize?: number, fill?: string) => void;
  addStickyNote: () => void;
  addStickyNoteAt: (text: string, x: number, y: number, fill?: string) => void;
  addDiagramOverlay: (
    diagram: BoardDiagramType,
    x: number,
    y: number,
    w: number,
    h: number,
    items?: string[],
    accent?: string,
  ) => void;
  addImageFromUrl: (url: string, options?: ImageFitOptions) => Promise<void>;
  addImageFromFile: (file: File, options?: ImageFitOptions) => Promise<{ width: number; height: number }>;
  mergeLayoutObjects: (layoutJson: Record<string, unknown>, offset?: { x: number; y: number }) => Promise<void>;
  copySelected: () => Promise<boolean>;
  pasteClipboard: () => Promise<boolean>;
  pasteAtPoint: (normX: number, normY: number) => Promise<boolean>;
  canPasteClipboard: () => boolean;
  hasSelection: () => boolean;
  deleteSelected: () => void;
  resetBoard: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getLayoutJson: () => Record<string, unknown>;
  addShape: (shape: BoardMarkShapeType) => void;
  addSticker: (sticker: BoardMarkStickerId) => void;
  startDrawMode: () => void;
};

export type ImageFitOptions = {
  fit?: "default" | "cover";
  sendToBack?: boolean;
};

type QuickSelectorState = {
  x: number;
  y: number;
  normX: number;
  normY: number;
  mode: "empty" | "object";
  textCapable?: boolean;
  shapeCapable?: boolean;
  stickerCapable?: boolean;
};

type BoardCanvasEditorProps = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  boardId: string;
  layoutMode?: BoardLayoutMode;
  readOnly?: boolean;
  /** Tighter layout when shown in grid / carousel cells */
  embedded?: boolean;
  /** Fill embedded cell by cropping (cover) or letterboxing (contain). */
  cellFit?: "contain" | "cover";
  /** Fit to cell (default) or fixed canvas scale — e.g. 1 = 100% */
  viewZoom?: "fit" | number;
  /** When false (e.g. inactive grid cell), radial menu and keyboard shortcuts are disabled. */
  isActive?: boolean;
  onSave: (layout: Record<string, unknown>) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onBoardColorPick?: (hex: string) => void;
  onRequestImagePick?: () => void;
};

export const BoardCanvasEditor = forwardRef<BoardCanvasHandle, BoardCanvasEditorProps>(
  function BoardCanvasEditor(
    {
      layoutJson,
      colorKey,
      boardId,
      layoutMode = "vision",
      readOnly = false,
      embedded = false,
      cellFit = "contain",
      viewZoom = "fit",
      isActive = true,
      onSave,
      onHistoryChange,
      onBoardColorPick,
      onRequestImagePick,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasWrapRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const saveTimerRef = useRef<number>();
    const historyTimerRef = useRef<number>();
    const loadedBoardRef = useRef<string | null>(null);
    const restoringHistoryRef = useRef(false);
    const suppressHistoryRef = useRef(false);
    const historyRef = useRef<{ snapshots: string[]; index: number }>({ snapshots: [], index: -1 });
    const onHistoryChangeRef = useRef(onHistoryChange);
    const rebindStructureHandlersRef = useRef<(canvas: Canvas) => void>(() => {});
    const handleStructurePointerRef = useRef<(canvas: Canvas, target: FabricObjectType) => boolean>(() => false);
    const [quickSelector, setQuickSelector] = useState<QuickSelectorState | null>(null);
    const [drawingMode, setDrawingMode] = useState(false);
    const drawColorRef = useRef(MARK_SHAPE_STROKE);
    const deleteTargetRef = useRef<FabricObject | null>(null);
    const isActiveRef = useRef(isActive);
    isActiveRef.current = isActive;

    onHistoryChangeRef.current = onHistoryChange;

    useEffect(() => {
      if (!isActive) setQuickSelector(null);
    }, [isActive]);

    const scheduleSave = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        onSave(canvas.toJSON() as Record<string, unknown>);
      }, 700);
    }, [onSave, readOnly]);

    const notifyHistoryChange = useCallback(() => {
      const h = historyRef.current;
      onHistoryChangeRef.current?.({
        canUndo: h.index > 0,
        canRedo: h.index >= 0 && h.index < h.snapshots.length - 1,
      });
    }, []);

    const snapshotCanvas = useCallback((canvas: Canvas) => JSON.stringify(canvas.toJSON()), []);

    const resetHistory = useCallback(
      (canvas: Canvas) => {
        historyRef.current = { snapshots: [snapshotCanvas(canvas)], index: 0 };
        notifyHistoryChange();
      },
      [notifyHistoryChange, snapshotCanvas],
    );

    const commitHistorySnapshot = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly || restoringHistoryRef.current || suppressHistoryRef.current) return;
      const json = snapshotCanvas(canvas);
      const h = historyRef.current;
      if (h.snapshots.length === 0 || h.index < 0) {
        h.snapshots = [json];
        h.index = 0;
        notifyHistoryChange();
        return;
      }
      if (h.snapshots[h.index] === json) return;
      h.snapshots = h.snapshots.slice(0, h.index + 1);
      h.snapshots.push(json);
      if (h.snapshots.length > 40) {
        h.snapshots.shift();
      }
      h.index = h.snapshots.length - 1;
      notifyHistoryChange();
    }, [notifyHistoryChange, readOnly, snapshotCanvas]);

    const flushPendingHistory = useCallback(() => {
      window.clearTimeout(historyTimerRef.current);
      commitHistorySnapshot();
    }, [commitHistorySnapshot]);

    const recordHistory = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly || restoringHistoryRef.current) return;
      window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = window.setTimeout(commitHistorySnapshot, 250);
    }, [commitHistorySnapshot, readOnly]);

    const commitHistorySnapshotRef = useRef(commitHistorySnapshot);
    commitHistorySnapshotRef.current = commitHistorySnapshot;
    const recordHistoryRef = useRef(recordHistory);
    recordHistoryRef.current = recordHistory;
    const scheduleSaveRef = useRef(scheduleSave);
    scheduleSaveRef.current = scheduleSave;

    const applyHistorySnapshot = useCallback(
      async (index: number) => {
        const canvas = fabricRef.current;
        const h = historyRef.current;
        const json = h.snapshots[index];
        if (!canvas || !json) return;
        restoringHistoryRef.current = true;
        const bg = boardFillForKey(colorKey);
        await canvas.loadFromJSON(JSON.parse(json));
        canvas.backgroundColor = bg;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        restoringHistoryRef.current = false;
        h.index = index;
        notifyHistoryChange();
        scheduleSave();
        rebindStructureHandlersRef.current(canvas);
      },
      [colorKey, notifyHistoryChange, scheduleSave],
    );

    const undo = useCallback(() => {
      flushPendingHistory();
      const h = historyRef.current;
      if (h.index <= 0) return;
      void applyHistorySnapshot(h.index - 1);
    }, [applyHistorySnapshot, flushPendingHistory]);

    const redo = useCallback(() => {
      flushPendingHistory();
      const h = historyRef.current;
      if (h.index >= h.snapshots.length - 1) return;
      void applyHistorySnapshot(h.index + 1);
    }, [applyHistorySnapshot, flushPendingHistory]);

    const canUndo = useCallback(() => historyRef.current.index > 0, []);
    const canRedo = useCallback(
      () => historyRef.current.index >= 0 && historyRef.current.index < historyRef.current.snapshots.length - 1,
      [],
    );

    useEffect(() => {
      if (isActive) notifyHistoryChange();
    }, [isActive, notifyHistoryChange]);

    const closeQuickSelector = useCallback(() => {
      deleteTargetRef.current = null;
      setQuickSelector(null);
    }, []);

    const openQuickSelectorFromEvent = useCallback((canvas: Canvas, e: Event, target?: FabricObject) => {
      if (readOnly || !isActiveRef.current) return;
      if (canvas.isDrawingMode) {
        canvas.isDrawingMode = false;
        setDrawingMode(false);
      }
      const wrap = canvasWrapRef.current;
      if (!wrap) return;
      let clientX: number | undefined;
      let clientY: number | undefined;
      if ("clientX" in e && typeof e.clientX === "number") {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if ("touches" in e && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("changedTouches" in e && e.changedTouches[0]) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
      if (clientX == null || clientY == null) return;
      const rect = wrap.getBoundingClientRect();
      const pointer = canvas.getScenePoint(e as MouseEvent);

      if (target) {
        let root = target;
        while (root.group) {
          root = root.group;
        }
        deleteTargetRef.current = root;
        canvas.setActiveObject(root);
        const objects = canvas.getObjects();
        if (objects[objects.length - 1] !== root) {
          canvas.bringObjectToFront(root);
        }
        canvas.requestRenderAll();
      }

      let textCapable = false;
      let shapeCapable = false;
      let stickerCapable = false;
      if (target instanceof IText || target instanceof Textbox || target instanceof FabricText) {
        textCapable = true;
      } else if (target) {
        let root = target;
        while (root.group) {
          root = root.group;
        }
        if (root instanceof Group) {
          textCapable = root.getObjects().some((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
        }
        const markKind = typeof root.get === "function" ? root.get("markKind") : undefined;
        shapeCapable = markKind === "shape";
        stickerCapable = markKind === "sticker";
      }

      setQuickSelector({
        x: clientX - rect.left,
        y: clientY - rect.top,
        normX: Math.min(1, Math.max(0, pointer.x / ARTBOARD_WIDTH)),
        normY: Math.min(1, Math.max(0, pointer.y / ARTBOARD_HEIGHT)),
        mode: target ? "object" : "empty",
        textCapable,
        shapeCapable,
        stickerCapable,
      });
    }, [readOnly]);

    const openQuickSelectorRef = useRef(openQuickSelectorFromEvent);
    openQuickSelectorRef.current = openQuickSelectorFromEvent;

    const fitCanvas = useCallback((canvas: Canvas) => {
      const container = containerRef.current;
      const wrap = canvasWrapRef.current;
      if (!container) return;
      const pad = embedded ? 0 : 32;
      const maxW = Math.max(container.clientWidth - pad, 1);
      const maxH = Math.max(container.clientHeight - pad, 1);
      const containScale = Math.min(maxW / ARTBOARD_WIDTH, maxH / ARTBOARD_HEIGHT);
      const coverScale = Math.max(maxW / ARTBOARD_WIDTH, maxH / ARTBOARD_HEIGHT);
      const baseScale =
        embedded && cellFit === "cover"
          ? coverScale
          : Math.min(containScale, embedded ? Infinity : 1);
      const zoom =
        viewZoom === "fit"
          ? baseScale > 0
            ? baseScale
            : 0.5
          : typeof viewZoom === "number"
            ? containScale * viewZoom
            : baseScale > 0
              ? baseScale
              : 0.5;
      canvas.setZoom(zoom);
      const scaledW = ARTBOARD_WIDTH * zoom;
      const scaledH = ARTBOARD_HEIGHT * zoom;
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
    }, [cellFit, embedded, viewZoom]);

    useEffect(() => {
      if (!canvasElRef.current) return;
      const bg = boardFillForKey(colorKey);
      const canvas = new Canvas(canvasElRef.current, {
        width: ARTBOARD_WIDTH,
        height: ARTBOARD_HEIGHT,
        backgroundColor: bg,
        selection: !readOnly,
      });
      fabricRef.current = canvas;
      fitCanvas(canvas);

      const onResize = () => fitCanvas(canvas);
      window.addEventListener("resize", onResize);

      let containerObserver: ResizeObserver | undefined;
      if (embedded && containerRef.current) {
        containerObserver = new ResizeObserver(() => fitCanvas(canvas));
        containerObserver.observe(containerRef.current);
      }

      let onContextMenu: ((e: MouseEvent) => void) | undefined;

      if (!readOnly) {
        const onHistoryDebounced = () => {
          recordHistoryRef.current();
          scheduleSaveRef.current();
        };
        const onHistoryImmediate = () => {
          commitHistorySnapshotRef.current();
          scheduleSaveRef.current();
        };
        canvas.on("object:modified", (event) => {
          const target = event.target;
          if (target instanceof Group) {
            const structureId = target.get("structureId");
            const structureType = target.get("structureType");
            if (
              structureId &&
              structureType &&
              (structureType === "priority" || structureType === "checklist")
            ) {
              normalizeInteractiveStructureResize(target);
              reflowInteractiveStructure(target);
              rebindStructureHandlersRef.current(canvas);
              canvas.requestRenderAll();
            }
          }
          onHistoryDebounced();
        });
        canvas.on("object:added", onHistoryImmediate);
        canvas.on("object:removed", onHistoryImmediate);
        canvas.on("text:changed", onHistoryDebounced);
        canvas.on("editing:exited", onHistoryDebounced);
        canvas.on("path:created", (opt) => {
          const path = opt.path;
          if (path) {
            path.set({ markKind: "draw" });
          }
        });
        canvas.on("mouse:down", (opt) => {
          const e = opt.e as MouseEvent;
          if (canvas.isDrawingMode) return;

          const target = opt.target;

          if (target) {
            let hit: FabricObjectType | null = target;
            while (hit) {
              const role = structureProp(hit, "structureRole");
              if (
                role &&
                (role === "checkbox" || role === "add-row" || role === "label" || role === "priority-left" || role === "priority-right")
              ) {
                if (handleStructurePointerRef.current(canvas, hit)) {
                  opt.e.preventDefault?.();
                  opt.e.stopPropagation?.();
                  return;
                }
                break;
              }
              hit = hit.group ?? null;
            }
          }

          const isLeftEmpty = e.button === 0 && !target && !e.ctrlKey && !e.metaKey && !e.shiftKey;
          if (isLeftEmpty) {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            return;
          }

          if (!target) return;
          let root = target;
          while (root.group) {
            root = root.group;
          }
          const objects = canvas.getObjects();
          if (objects[objects.length - 1] !== root) {
            suppressHistoryRef.current = true;
            canvas.bringObjectToFront(root);
            canvas.requestRenderAll();
            window.setTimeout(() => {
              suppressHistoryRef.current = false;
            }, 0);
          }
        });

        onContextMenu = (e: MouseEvent) => {
          if (!isActiveRef.current) return;
          e.preventDefault();
          openQuickSelectorRef.current(canvas, e, canvas.findTarget(e) ?? undefined);
        };
        canvas.upperCanvasEl.addEventListener("contextmenu", onContextMenu);
      }

      return () => {
        if (onContextMenu) {
          canvas.upperCanvasEl.removeEventListener("contextmenu", onContextMenu);
        }
        window.removeEventListener("resize", onResize);
        containerObserver?.disconnect();
        window.clearTimeout(saveTimerRef.current);
        window.clearTimeout(historyTimerRef.current);
        canvas.dispose();
        fabricRef.current = null;
        loadedBoardRef.current = null;
      };
    }, [colorKey, embedded, fitCanvas, readOnly]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const interactive = isActive;
      canvas.selection = interactive;
      canvas.skipTargetFind = !interactive;
      canvas.forEachObject((obj) => {
        obj.selectable = interactive;
        obj.evented = interactive;
      });
      if (!interactive) canvas.discardActiveObject();
      canvas.requestRenderAll();
    }, [isActive, readOnly]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (canvas) fitCanvas(canvas);
    }, [cellFit, fitCanvas, viewZoom]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (loadedBoardRef.current === boardId) return;
      loadedBoardRef.current = boardId;
      const bg = boardFillForKey(colorKey);
      canvas.backgroundColor = bg;

      const hasObjects =
        layoutJson &&
        typeof layoutJson === "object" &&
        Array.isArray((layoutJson as { objects?: unknown[] }).objects) &&
        ((layoutJson as { objects: unknown[] }).objects?.length ?? 0) > 0;

      if (hasObjects) {
        canvas.loadFromJSON(layoutJson).then(() => {
          canvas.backgroundColor = bg;
          canvas.getObjects().forEach((obj) => {
            if (obj instanceof Group && structureProp(obj, "structureId")) {
              restoreStructureGroupState(obj);
            }
          });
          canvas.requestRenderAll();
          resetHistory(canvas);
          rebindStructureHandlersRef.current(canvas);
        });
      } else {
        canvas.clear();
        canvas.backgroundColor = bg;
        canvas.requestRenderAll();
        resetHistory(canvas);
      }
    }, [boardId, colorKey, layoutJson, resetHistory]);

    const addText = useCallback((text = "") => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new IText(text, {
        left: ARTBOARD_WIDTH * 0.15,
        top: ARTBOARD_HEIGHT * 0.2,
        fontSize: 42,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
      });
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        t.enterEditing();
        t.selectAll();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const addStickyNote = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const w = 280;
      const h = 200;
      const left = ARTBOARD_WIDTH * 0.1;
      const top = ARTBOARD_HEIGHT * 0.35;
      const rect = new Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: "#FFF9C4",
        stroke: "#E8D44D",
        strokeWidth: 1,
        rx: 8,
        ry: 8,
        selectable: false,
        evented: false,
      });
      const note = new Textbox("", {
        left: 16,
        top: 16,
        width: w - 32,
        fontSize: 22,
        fontFamily: "system-ui, sans-serif",
        fill: "#171717",
        splitByGrapheme: true,
      });
      const sticky = new Group([rect, note], {
        left,
        top,
        subTargetCheck: true,
      });
      canvas.add(sticky);
      canvas.setActiveObject(note);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        note.enterEditing();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const addTextAtPoint = useCallback((normX: number, normY: number) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new IText("", {
        left: normX * ARTBOARD_WIDTH,
        top: normY * ARTBOARD_HEIGHT,
        fontSize: MARK_TEXT_SIZES.XL,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
      });
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        t.enterEditing();
        t.selectAll();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const addStickyNoteAtPoint = useCallback((normX: number, normY: number) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const w = 280;
      const h = 200;
      const left = normX * ARTBOARD_WIDTH - w / 2;
      const top = normY * ARTBOARD_HEIGHT - h / 2;
      const rect = new Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: "#FFF9C4",
        stroke: "#E8D44D",
        strokeWidth: 1,
        rx: 8,
        ry: 8,
        selectable: false,
        evented: false,
      });
      const note = new Textbox("", {
        left: 16,
        top: 16,
        width: w - 32,
        fontSize: 22,
        fontFamily: "system-ui, sans-serif",
        fill: "#171717",
        splitByGrapheme: true,
      });
      const sticky = new Group([rect, note], {
        left,
        top,
        subTargetCheck: true,
      });
      canvas.add(sticky);
      canvas.setActiveObject(note);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        note.enterEditing();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const exitDrawMode = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.isDrawingMode = false;
      setDrawingMode(false);
    }, []);

    const startDrawMode = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      deleteTargetRef.current = null;
      setQuickSelector(null);
      const brush = new PencilBrush(canvas);
      brush.color = drawColorRef.current;
      brush.width = MARK_DRAW_WIDTH;
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setDrawingMode(true);
    }, [readOnly]);

    const addShapeAtPoint = useCallback(
      (shapeType: BoardMarkShapeType, normX: number, normY: number, stroke = MARK_SHAPE_STROKE) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const cx = normX * ARTBOARD_WIDTH;
        const cy = normY * ARTBOARD_HEIGHT;
        const fill = `${stroke}33`;
        const mark = { markKind: "shape" as const, shapeType };
        let shape: FabricObject;
        if (shapeType === "rect") {
          shape = new Rect({
            left: cx - 60,
            top: cy - 45,
            width: 120,
            height: 90,
            fill,
            stroke,
            strokeWidth: 3,
            rx: 4,
            ry: 4,
            ...mark,
          });
        } else if (shapeType === "circle") {
          shape = new Circle({
            left: cx - 55,
            top: cy - 55,
            radius: 55,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        } else if (shapeType === "triangle") {
          shape = new Triangle({
            left: cx - 50,
            top: cy - 45,
            width: 100,
            height: 90,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        } else if (shapeType === "line") {
          shape = new Line([cx - 70, cy, cx + 70, cy], {
            stroke,
            strokeWidth: 3,
            fill: "transparent",
            ...mark,
          });
        } else if (shapeType === "hexagon") {
          shape = new Polygon(
            [
              { x: 0, y: -50 },
              { x: 43, y: -25 },
              { x: 43, y: 25 },
              { x: 0, y: 50 },
              { x: -43, y: 25 },
              { x: -43, y: -25 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "pentagon") {
          shape = new Polygon(
            [
              { x: 0, y: -50 },
              { x: 48, y: -15 },
              { x: 30, y: 40 },
              { x: -30, y: 40 },
              { x: -48, y: -15 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "star") {
          shape = new Polygon(
            [
              { x: 0, y: -52 },
              { x: 12, y: -16 },
              { x: 50, y: -16 },
              { x: 20, y: 8 },
              { x: 32, y: 44 },
              { x: 0, y: 24 },
              { x: -32, y: 44 },
              { x: -20, y: 8 },
              { x: -50, y: -16 },
              { x: -12, y: -16 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "diamond") {
          shape = new Polygon(
            [
              { x: 0, y: -55 },
              { x: 40, y: 0 },
              { x: 0, y: 55 },
              { x: -40, y: 0 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "heart") {
          shape = new Path(
            "M 50 88 C 20 66 6 52 6 34 C 6 20 16 10 30 10 C 38 10 45 14 50 20 C 55 14 62 10 70 10 C 84 10 94 20 94 34 C 94 52 80 66 50 88 Z",
            {
              left: cx - 50,
              top: cy - 50,
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "bubble") {
          shape = new Path(
            "M 8 10 Q 8 2 16 2 L 104 2 Q 112 2 112 10 L 112 58 Q 112 66 104 66 L 58 66 L 44 82 L 46 66 L 16 66 Q 8 66 8 58 Z",
            {
              left: cx - 60,
              top: cy - 42,
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "cylinder") {
          shape = new Path(
            "M 16 14 Q 16 2 60 2 Q 104 2 104 14 L 104 72 Q 104 84 60 84 Q 16 84 16 72 Z M 16 14 Q 16 26 60 26 Q 104 26 104 14",
            {
              left: cx - 60,
              top: cy - 43,
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else {
          // arrow
          shape = new Path("M 0 0 L 92 0 L 92 -16 L 128 0 L 92 16 L 92 0 L 0 0 Z", {
            left: cx - 64,
            top: cy - 16,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        }
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
        scheduleSave();
      },
      [readOnly, scheduleSave],
    );

    const addStickerAtPoint = useCallback(
      (stickerId: BoardMarkStickerId, normX: number, normY: number) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const sticker = new FabricText(BOARD_MARK_STICKER_EMOJI[stickerId], {
          left: normX * ARTBOARD_WIDTH,
          top: normY * ARTBOARD_HEIGHT,
          fontSize: 72,
          fontFamily: "system-ui, sans-serif",
          originX: "center",
          originY: "center",
          markKind: "sticker",
          stickerId,
        });
        canvas.add(sticker);
        canvas.setActiveObject(sticker);
        canvas.requestRenderAll();
        scheduleSave();
      },
      [readOnly, scheduleSave],
    );

    const swapMarkShape = useCallback(
      (shapeType: BoardMarkShapeType) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const selected = deleteTargetRef.current ?? canvas.getActiveObject();
        if (!selected) return;
        let root: FabricObject = selected;
        while (root.group) root = root.group;
        if (root.get("markKind") !== "shape") return;
        const center = root.getCenterPoint();
        canvas.remove(root);
        deleteTargetRef.current = null;
        addShapeAtPoint(shapeType, center.x / ARTBOARD_WIDTH, center.y / ARTBOARD_HEIGHT, (root.stroke as string) || MARK_SHAPE_STROKE);
        recordHistory();
      },
      [addShapeAtPoint, readOnly, recordHistory],
    );

    const swapMarkSticker = useCallback(
      (stickerId: BoardMarkStickerId) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const selected = deleteTargetRef.current ?? canvas.getActiveObject();
        if (!selected) return;
        let root: FabricObject = selected;
        while (root.group) root = root.group;
        if (root.get("markKind") !== "sticker" || !(root instanceof FabricText)) return;
        root.set({ text: BOARD_MARK_STICKER_EMOJI[stickerId], stickerId });
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    const placeImage = (canvas: Canvas, img: FabricImage, options?: ImageFitOptions) => {
      const fit = options?.fit ?? "default";
      if (fit === "cover") {
        const iw = img.width || 1;
        const ih = img.height || 1;
        const imgAspect = iw / ih;
        const boardAspect = ARTBOARD_WIDTH / ARTBOARD_HEIGHT;
        let scale: number;
        if (imgAspect > boardAspect) {
          scale = ARTBOARD_HEIGHT / ih;
        } else {
          scale = ARTBOARD_WIDTH / iw;
        }
        img.set({
          left: ARTBOARD_WIDTH / 2,
          top: ARTBOARD_HEIGHT / 2,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });
      } else {
        const maxSide = Math.min(ARTBOARD_WIDTH, ARTBOARD_HEIGHT) * 0.45;
        const scale = Math.min(maxSide / (img.width || 1), maxSide / (img.height || 1), 1);
        img.set({
          left: ARTBOARD_WIDTH * 0.25,
          top: ARTBOARD_HEIGHT * 0.15,
          scaleX: scale,
          scaleY: scale,
        });
      }
      canvas.add(img);
      if (options?.sendToBack) {
        canvas.sendObjectToBack(img);
      }
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    };

    const addImageFromUrl = useCallback(async (url: string, options?: ImageFitOptions) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      try {
        const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
        placeImage(canvas, img, options);
      } catch {
        const res = await fetch(url);
        if (!res.ok) throw new Error("image fetch failed");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        try {
          const img = await FabricImage.fromURL(blobUrl);
          placeImage(canvas, img, options);
        } finally {
          URL.revokeObjectURL(blobUrl);
        }
      }
    }, [readOnly]);

    const addImageFromFile = useCallback(async (file: File, options?: ImageFitOptions) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) throw new Error("read only");
      const blobUrl = URL.createObjectURL(file);
      try {
        const img = await FabricImage.fromURL(blobUrl);
        placeImage(canvas, img, options);
        return { width: img.width || 1, height: img.height || 1 };
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }, [readOnly]);

    const addTextAt = useCallback((text: string, left: number, top: number, fontSize = 28) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new FabricText(text, {
        left,
        top,
        fontSize,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
        originX: "center",
        originY: "center",
      });
      canvas.add(t);
      canvas.requestRenderAll();
    }, [readOnly]);

    const addTextNormalized = useCallback(
      (text: string, x: number, y: number, fontSize = 36, fill = MARK_TEXT_FILL) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const t = new FabricText(text, {
          left: x * ARTBOARD_WIDTH,
          top: y * ARTBOARD_HEIGHT,
          fontSize,
          fontFamily: "system-ui, sans-serif",
          fill,
          fontWeight: "600",
          originX: "center",
          originY: "center",
        });
        canvas.add(t);
        canvas.requestRenderAll();
      },
      [readOnly],
    );

    const addStickyNoteAt = useCallback(
      (text: string, x: number, y: number, fill = "#FFF9C4") => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const w = 260;
        const h = 170;
        const left = x * ARTBOARD_WIDTH;
        const top = y * ARTBOARD_HEIGHT;
        const stroke = fill === "#FFF9C4" ? "#E8D44D" : fill;
        const rect = new Rect({
          left: 0,
          top: 0,
          width: w,
          height: h,
          fill,
          stroke,
          strokeWidth: 1,
          rx: 8,
          ry: 8,
          selectable: false,
          evented: false,
        });
        const note = new Textbox(text, {
          left: 14,
          top: 14,
          width: w - 28,
          fontSize: 20,
          fontFamily: "system-ui, sans-serif",
          fill: "#171717",
          splitByGrapheme: true,
        });
        canvas.add(new Group([rect, note], { left, top, subTargetCheck: true }));
        canvas.requestRenderAll();
      },
      [readOnly],
    );

    const rebindStructureHandlers = useCallback(
      (canvas: Canvas) => {
        if (readOnly) return;

        const addRow = (structureId: string, structureType: string) => {
          const group = findStructureGroup(canvas, structureId, structureType);
          if (!group) return;

          if (structureType === "checklist") {
            const rowIndex = group.getObjects().filter((o) => structureProp(o, "structureRole") === "checkbox").length;
            const rowTop = 8 + rowIndex * STRUCTURE_ROW_H;
            const box = new Rect({
              left: 0,
              top: rowTop,
              width: STRUCTURE_BOX,
              height: STRUCTURE_BOX,
              fill: "transparent",
              stroke: DECAL_INK,
              strokeWidth: 2,
              rx: 2,
              ry: 2,
              selectable: false,
              evented: true,
              hoverCursor: "pointer",
            });
            box.set({
              structureId,
              structureType,
              structureRole: "checkbox",
              rowIndex,
              checked: false,
            });
            const label = new IText("", {
              left: STRUCTURE_BOX + 10,
              top: rowTop - 2,
              width: Math.max(120, getStructureLayoutWidth(group) - STRUCTURE_BOX - 24),
              fontSize: 18,
              fontFamily: STRUCTURE_FONT,
              fill: DECAL_INK,
              editable: true,
              selectable: false,
              evented: true,
            });
            label.set({ structureId, structureType, structureRole: "label", rowIndex });
            group.add(box, label);
            const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
            if (addBtn) addBtn.set({ top: rowTop + STRUCTURE_ROW_H + 4 });
          }

          if (structureType === "priority") {
            const rowIndex = group
              .getObjects()
              .filter((o) => structureProp(o, "structureRole") === "priority-left").length;
            const rowTop = 44 + rowIndex * STRUCTURE_ROW_H;
            const midX = getStructureLayoutWidth(group) * 0.55;
            const left = new IText("", {
              left: 8,
              top: rowTop,
              width: midX - 20,
              fontSize: 18,
              fontFamily: STRUCTURE_FONT,
              fill: DECAL_INK,
              editable: true,
              selectable: false,
              evented: true,
            });
            left.set({ structureId, structureType, structureRole: "priority-left", rowIndex });
            const right = new IText(String(rowIndex + 1), {
              left: midX + 8,
              top: rowTop,
              width: getStructureLayoutWidth(group) - midX - 16,
              fontSize: 18,
              fontFamily: STRUCTURE_FONT,
              fill: DECAL_INK,
              textAlign: "right",
              editable: true,
              selectable: false,
              evented: true,
            });
            right.set({ structureId, structureType, structureRole: "priority-right", rowIndex });
            group.add(left, right);
            const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
            if (addBtn) addBtn.set({ top: rowTop + STRUCTURE_ROW_H + 6 });
            const frameV = group.getObjects().find((o) => structureProp(o, "structureRole") === "frame-v");
            if (frameV instanceof Rect) {
              frameV.set({ height: rowTop + STRUCTURE_ROW_H + 28 });
            }
          }

          group.setCoords();
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
          rebindStructureHandlersRef.current(canvas);
        };

        walkStructureObjects(canvas, (obj) => {
          if (!(obj instanceof IText)) return;
          const role = structureProp(obj, "structureRole");
          if (role !== "label" && role !== "priority-left" && role !== "priority-right") return;
          const structureId = structureProp(obj, "structureId") as string | undefined;
          const structureType = structureProp(obj, "structureType") as string | undefined;
          if (!structureId || !structureType) return;
          obj.off("keydown");
          obj.on("keydown", (opt) => {
            const e = (opt as { e?: KeyboardEvent }).e;
            if (!e || e.key !== "Enter") return;
            e.preventDefault();
            obj.exitEditing();
            addRow(structureId, structureType);
          });
        });
      },
      [readOnly, recordHistory, scheduleSave],
    );

    rebindStructureHandlersRef.current = rebindStructureHandlers;

    const handleStructurePointer = useCallback(
      (canvas: Canvas, target: FabricObjectType) => {
        const role = structureProp(target, "structureRole");
        const structureId = structureProp(target, "structureId") as string | undefined;
        const structureType = structureProp(target, "structureType") as string | undefined;
        if (!role || !structureId || !structureType) return false;

        if (
          (role === "label" || role === "priority-left" || role === "priority-right") &&
          target instanceof IText
        ) {
          canvas.setActiveObject(target);
          target.enterEditing();
          canvas.requestRenderAll();
          return true;
        }

        if (role === "checkbox" && target instanceof Rect) {
          const checked = !structureProp(target, "checked");
          target.set({
            checked,
            fill: checked ? DECAL_INK : "transparent",
          });
          const rowIndex = structureProp(target, "rowIndex") as number | undefined;
          const group = findStructureGroup(canvas, structureId, structureType);
          const label = group
            ?.getObjects()
            .find(
              (o) =>
                structureProp(o, "structureRole") === "label" && structureProp(o, "rowIndex") === rowIndex,
            );
          if (label instanceof IText) {
            label.set({ linethrough: checked, fill: checked ? DECAL_MUTED : DECAL_INK });
          }
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
          return true;
        }

        if (role === "add-row") {
          rebindStructureHandlersRef.current(canvas);
          const group = findStructureGroup(canvas, structureId, structureType);
          if (!group) return true;
          const addRow = () => {
            const rowIndex =
              structureType === "checklist"
                ? group.getObjects().filter((o) => structureProp(o, "structureRole") === "checkbox").length
                : group.getObjects().filter((o) => structureProp(o, "structureRole") === "priority-left").length;
            const rowTop = (structureType === "checklist" ? 8 : 44) + rowIndex * STRUCTURE_ROW_H;

            if (structureType === "checklist") {
              const box = new Rect({
                left: 0,
                top: rowTop,
                width: STRUCTURE_BOX,
                height: STRUCTURE_BOX,
                fill: "transparent",
                stroke: DECAL_INK,
                strokeWidth: 2,
                rx: 2,
                ry: 2,
                selectable: false,
                evented: true,
                hoverCursor: "pointer",
              });
              box.set({
                structureId,
                structureType,
                structureRole: "checkbox",
                rowIndex,
                checked: false,
              });
              const label = new IText("", {
                left: STRUCTURE_BOX + 10,
                top: rowTop - 2,
                width: Math.max(120, getStructureLayoutWidth(group) - STRUCTURE_BOX - 24),
                fontSize: 18,
                fontFamily: STRUCTURE_FONT,
                fill: DECAL_INK,
                editable: true,
                selectable: false,
                evented: true,
              });
              label.set({ structureId, structureType, structureRole: "label", rowIndex });
              group.add(box, label);
            } else {
              const midX = getStructureLayoutWidth(group) * 0.55;
              const left = new IText("", {
                left: 8,
                top: rowTop,
                width: midX - 20,
                fontSize: 18,
                fontFamily: STRUCTURE_FONT,
                fill: DECAL_INK,
                editable: true,
                selectable: false,
                evented: true,
              });
              left.set({ structureId, structureType, structureRole: "priority-left", rowIndex });
              const right = new IText(String(rowIndex + 1), {
                left: midX + 8,
                top: rowTop,
                width: getStructureLayoutWidth(group) - midX - 16,
                fontSize: 18,
                fontFamily: STRUCTURE_FONT,
                fill: DECAL_INK,
                textAlign: "right",
                editable: true,
                selectable: false,
                evented: true,
              });
              right.set({ structureId, structureType, structureRole: "priority-right", rowIndex });
              group.add(left, right);
              const frameV = group.getObjects().find((o) => structureProp(o, "structureRole") === "frame-v");
              if (frameV instanceof Rect) frameV.set({ height: rowTop + STRUCTURE_ROW_H + 28 });
            }

            target.set({ top: rowTop + STRUCTURE_ROW_H + (structureType === "checklist" ? 4 : 6) });
            group.setCoords();
            canvas.requestRenderAll();
            recordHistory();
            scheduleSave();
            rebindStructureHandlersRef.current(canvas);
          };
          addRow();
          return true;
        }

        return false;
      },
      [recordHistory, scheduleSave],
    );

    handleStructurePointerRef.current = handleStructurePointer;

    const placeInteractiveChecklist = (left: number, top: number, width: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const structureId = crypto.randomUUID();
      const rowCount = 4;
      const parts: FabricObjectType[] = [];

      for (let i = 0; i < rowCount; i++) {
        const rowTop = 8 + i * STRUCTURE_ROW_H;
        const box = new Rect({
          left: 0,
          top: rowTop,
          width: STRUCTURE_BOX,
          height: STRUCTURE_BOX,
          fill: "transparent",
          stroke: DECAL_INK,
          strokeWidth: 2,
          rx: 2,
          ry: 2,
          selectable: false,
          evented: true,
          hoverCursor: "pointer",
        });
        box.set({
          structureId,
          structureType: "checklist",
          structureRole: "checkbox",
          rowIndex: i,
          checked: false,
        });
        const label = new IText("", {
          left: STRUCTURE_BOX + 10,
          top: rowTop - 2,
          width: width - STRUCTURE_BOX - 24,
          fontSize: 18,
          fontFamily: STRUCTURE_FONT,
          fill: DECAL_INK,
          editable: true,
          selectable: false,
          evented: true,
        });
        label.set({ structureId, structureType: "checklist", structureRole: "label", rowIndex: i });
        parts.push(box, label);
      }

      const addBtn = new FabricText("", {
        left: 0,
        top: 8 + rowCount * STRUCTURE_ROW_H + 4,
        fontSize: 14,
        fontFamily: STRUCTURE_FONT,
        fill: DECAL_MUTED,
        selectable: false,
        evented: true,
        hoverCursor: "pointer",
      });
      addBtn.set({ structureId, structureType: "checklist", structureRole: "add-row" });
      parts.push(addBtn);

      const group = new Group(parts, {
        left,
        top,
        subTargetCheck: true,
        interactive: true,
        objectCaching: false,
        cornerStyle: "circle",
        borderColor: "rgba(17,17,17,0.45)",
        cornerColor: "#111111",
        transparentCorners: false,
      });
      group.set({ structureId, structureType: "checklist", structureWidth: width });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
      rebindStructureHandlersRef.current(canvas);
    };

    const placeInteractivePriority = (left: number, top: number, width: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const structureId = crypto.randomUUID();
      const midX = width * 0.55;
      const rowCount = 6;
      const parts: FabricObjectType[] = [];

      parts.push(
        new Rect({
          left: 0,
          top: 34,
          width,
          height: 2,
          fill: DECAL_LINE,
          selectable: false,
          evented: false,
        }),
      );
      const frameV = new Rect({
        left: midX,
        top: 0,
        width: 2,
        height: 44 + rowCount * STRUCTURE_ROW_H + 16,
        fill: DECAL_LINE,
        selectable: false,
        evented: false,
      });
      frameV.set({ structureRole: "frame-v" });
      parts.push(frameV);

      for (let i = 0; i < rowCount; i++) {
        const rowTop = 44 + i * STRUCTURE_ROW_H;
        const leftCell = new IText("", {
          left: 8,
          top: rowTop,
          width: midX - 20,
          fontSize: 18,
          fontFamily: STRUCTURE_FONT,
          fill: DECAL_INK,
          editable: true,
          selectable: false,
          evented: true,
        });
        leftCell.set({ structureId, structureType: "priority", structureRole: "priority-left", rowIndex: i });
        const rightCell = new IText(String(i + 1), {
          left: midX + 8,
          top: rowTop,
          width: width - midX - 16,
          fontSize: 18,
          fontFamily: STRUCTURE_FONT,
          fill: DECAL_INK,
          textAlign: "right",
          editable: true,
          selectable: false,
          evented: true,
        });
        rightCell.set({ structureId, structureType: "priority", structureRole: "priority-right", rowIndex: i });
        parts.push(leftCell, rightCell);
      }

      const addBtn = new FabricText("", {
        left: 0,
        top: 44 + rowCount * STRUCTURE_ROW_H + 6,
        fontSize: 14,
        fontFamily: STRUCTURE_FONT,
        fill: DECAL_MUTED,
        selectable: false,
        evented: true,
        hoverCursor: "pointer",
      });
      addBtn.set({ structureId, structureType: "priority", structureRole: "add-row" });
      parts.push(addBtn);

      const group = new Group(parts, {
        left,
        top,
        subTargetCheck: true,
        interactive: true,
        objectCaching: false,
        cornerStyle: "circle",
        borderColor: "rgba(17,17,17,0.45)",
        cornerColor: "#111111",
        transparentCorners: false,
      });
      group.set({ structureId, structureType: "priority", structureWidth: width });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
      rebindStructureHandlersRef.current(canvas);
    };

    const addDiagramOverlay = useCallback(
      (
        diagram: BoardDiagramType,
        x: number,
        y: number,
        w: number,
        h: number,
        items: string[] = [],
        accent = DECAL_INK,
      ) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;

        const left = x * ARTBOARD_WIDTH;
        const top = y * ARTBOARD_HEIGHT;
        const width = w * ARTBOARD_WIDTH;
        const height = h * ARTBOARD_HEIGHT;

        const objects: FabricObject[] = [];

        const addLine = (lx: number, ly: number, lw: number, lh = 3, fill = DECAL_LINE) => {
          objects.push(makeDecalLine(lx, ly, lw, lh, fill));
        };

        const addText = (
          text: string,
          lx: number,
          ly: number,
          size = 24,
          fill = DECAL_INK,
          weight: string | number = 700,
        ) => {
          objects.push(makeDecalText(text, lx, ly, size, fill, weight));
        };

        if (diagram === "kanban") {
          const labels = items.length >= 3 ? items.slice(0, 3) : ["TO DO", "IN PROGRESS", "DONE"];
          const colW = width / labels.length;

          labels.forEach((label, i) => {
            addText(label, i * colW + 8, 0, 22);
            if (i > 0) addLine(i * colW, 42, 3, height - 42);
          });

          addLine(0, 38, width, 3);
          addLine(0, height - 3, width, 3, "rgba(17,17,17,0.35)");
        }

        if (diagram === "checklist") {
          placeInteractiveChecklist(left, top, width);
          return;
        }

        if (diagram === "zones") {
          const zones = items.length ? items.slice(0, 4) : ["Zone 1", "Zone 2", "Zone 3"];
          addText("Zones", 0, 0, 22);

          const rowH = (height - 42) / zones.length;
          zones.forEach((zone, i) => {
            const rowTop = 42 + i * rowH;
            addText(zone, 0, rowTop + rowH / 2 - 12, 18, DECAL_MUTED, 600);
            addLine(width * 0.28, rowTop + rowH / 2, width * 0.72, 2, "rgba(17,17,17,0.38)");
            if (i > 0) addLine(0, rowTop, width, 2, "rgba(17,17,17,0.28)");
          });
        }

        if (diagram === "eisenhower") {
          placeInteractivePriority(left, top, width);
          return;
        }

        if (diagram === "timeline") {
          const labels = items.length ? items.slice(0, 5) : ["Start", "Middle", "Milestone", "Finish"];
          const yMid = height / 2;

          addText("Timeline", 0, 0, 22);
          addLine(0, yMid, width, 3);

          labels.forEach((label, i) => {
            const tickX = (width / Math.max(labels.length - 1, 1)) * i;
            addLine(tickX, yMid - 14, 3, 28);
            addText(label, Math.max(0, tickX - 26), yMid + 24, 14, DECAL_MUTED, 600);
          });
        }

        if (diagram === "gantt") {
          const rows = items.length ? items.slice(0, 5) : ["Phase 1", "Phase 2", "Phase 3"];
          addText("Schedule", 0, 0, 22);

          rows.forEach((row, i) => {
            const rowTop = 46 + i * 38;
            addText(row, 0, rowTop - 5, 14, DECAL_MUTED, 600);
            addLine(width * 0.28, rowTop + 4, width * 0.68, 2, "rgba(17,17,17,0.22)");

            const barLeft = width * (0.32 + i * 0.08);
            const barWidth = width * (0.34 - i * 0.03);
            addLine(barLeft, rowTop, barWidth, 10, accent);
          });
        }

        if (diagram === "okrs") {
          const labels = items.length >= 4 ? items.slice(0, 4) : ["Objective", "KR 1", "KR 2", "KR 3"];
          addText(labels[0], 0, 0, 22);
          addLine(0, 36, width, 3);

          labels.slice(1).forEach((label, i) => {
            const rowTop = 62 + i * 42;
            addText(label, 0, rowTop - 5, 16, DECAL_MUTED, 700);
            addLine(width * 0.22, rowTop + 5, width * 0.72, 2, "rgba(17,17,17,0.25)");
            addLine(width * 0.22, rowTop + 5, width * (0.18 + i * 0.08), 6, DECAL_INK);
          });
        }

        if (diagram === "five_s") {
          const steps = items.length >= 5 ? items.slice(0, 5) : ["Sort", "Set", "Shine", "Standardize", "Sustain"];
          const colW = width / steps.length;

          addLine(0, 0, width, 3);
          addLine(0, height - 3, width, 3);

          steps.forEach((step, i) => {
            if (i > 0) addLine(i * colW, 0, 3, height);
            addText(step, i * colW + 8, height / 2 - 12, 14, DECAL_INK, 700);
          });
        }

        if (diagram === "divider") {
          const line = new Rect({
            left: left + width / 2,
            top: top + height / 2,
            width,
            height: 4,
            fill: DECAL_LINE,
            rx: 2,
            ry: 2,
            originX: "center",
            originY: "center",
          });
          canvas.add(line);
          canvas.setActiveObject(line);
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
          return;
        }

        if (!objects.length) return;

        const group = new Group(objects, {
          left,
          top,
          subTargetCheck: false,
          objectCaching: true,
          cornerStyle: "circle",
          borderColor: "rgba(17,17,17,0.45)",
          cornerColor: "#111111",
          transparentCorners: false,
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    const mergeLayoutObjects = useCallback(async (
      layoutJson: Record<string, unknown>,
      offset = { x: 40, y: 40 },
    ) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const objects = (layoutJson as { objects?: Record<string, unknown>[] }).objects ?? [];
      if (!objects.length) return;

      const fragment = JSON.parse(JSON.stringify(layoutJson)) as Record<string, unknown> & {
        objects: Record<string, unknown>[];
      };
      for (const obj of fragment.objects) {
        if (typeof obj.left === "number") obj.left = (obj.left as number) + offset.x;
        if (typeof obj.top === "number") obj.top = (obj.top as number) + offset.y;
      }

      const tempEl = document.createElement("canvas");
      const temp = new StaticCanvas(tempEl, {
        width: ARTBOARD_WIDTH,
        height: ARTBOARD_HEIGHT,
      });
      await temp.loadFromJSON(fragment);
      const clones = await Promise.all(temp.getObjects().map((obj) => obj.clone()));
      temp.dispose();
      for (const obj of clones) {
        if (obj instanceof Group && structureProp(obj, "structureId")) {
          restoreStructureGroupState(obj);
        }
        canvas.add(obj as FabricObject);
      }
      rebindStructureHandlersRef.current(canvas);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

    const copySelected = useCallback(async () => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return false;

      let activeObject = canvas.getActiveObject();
      if (!activeObject) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) activeObject = activeObjects[0];
      }
      if (!activeObject) return false;

      const toCopy =
        activeObject instanceof ActiveSelection ? activeObject.getObjects() : [activeObject];
      if (!toCopy.length) return false;

      const clones = await Promise.all(toCopy.map((obj) => obj.clone()));
      boardObjectClipboard = clones.map((obj) => obj.toObject() as Record<string, unknown>);
      return true;
    }, [readOnly]);

    const canPasteClipboard = useCallback(() => Boolean(boardObjectClipboard?.length), []);

    const hasSelection = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return false;
      return Boolean(canvas.getActiveObject() || canvas.getActiveObjects().length);
    }, []);

    const pasteClipboard = useCallback(async () => {
      if (!boardObjectClipboard?.length) return false;
      await mergeLayoutObjects({ objects: boardObjectClipboard }, { x: 24, y: 24 });
      return true;
    }, [mergeLayoutObjects]);

    const pasteAtPoint = useCallback(
      async (normX: number, normY: number) => {
        if (!boardObjectClipboard?.length) return false;
        const left = normX * ARTBOARD_WIDTH;
        const top = normY * ARTBOARD_HEIGHT;
        let minLeft = Infinity;
        let minTop = Infinity;
        for (const obj of boardObjectClipboard) {
          if (typeof obj.left === "number") minLeft = Math.min(minLeft, obj.left);
          if (typeof obj.top === "number") minTop = Math.min(minTop, obj.top);
        }
        if (!Number.isFinite(minLeft)) minLeft = 0;
        if (!Number.isFinite(minTop)) minTop = 0;
        await mergeLayoutObjects({ objects: boardObjectClipboard }, { x: left - minLeft, y: top - minTop });
        return true;
      },
      [mergeLayoutObjects],
    );

    const deleteSelected = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;

      const topLevelRoot = (obj: FabricObject): FabricObject => {
        let root = obj;
        while (root.group) root = root.group as FabricObject;
        return root;
      };

      let activeObject = canvas.getActiveObject();
      if (!activeObject && deleteTargetRef.current) {
        activeObject = deleteTargetRef.current;
      }
      if (!activeObject) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) activeObject = activeObjects[0];
      }
      if (!activeObject) return;

      if (activeObject instanceof IText || activeObject instanceof Textbox) {
        if (activeObject.isEditing) activeObject.exitEditing();
      }

      const toRemove =
        activeObject instanceof ActiveSelection
          ? [...new Set(activeObject.getObjects().map(topLevelRoot))]
          : [topLevelRoot(activeObject)];

      if (!toRemove.length) return;

      canvas.discardActiveObject();
      for (const obj of toRemove) {
        canvas.remove(obj);
      }
      deleteTargetRef.current = null;
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

    const resetBoard = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const bg = boardFillForKey(colorKey);

      window.clearTimeout(saveTimerRef.current);
      window.clearTimeout(historyTimerRef.current);
      suppressHistoryRef.current = true;

      canvas.discardActiveObject();
      for (const obj of [...canvas.getObjects()]) {
        canvas.remove(obj);
      }
      canvas.backgroundColor = bg;
      canvas.requestRenderAll();
      deleteTargetRef.current = null;

      resetHistory(canvas);
      suppressHistoryRef.current = false;

      onSave(canvas.toJSON() as Record<string, unknown>);
    }, [colorKey, onSave, readOnly, resetHistory]);

    const selectAllObjects = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const objects = canvas.getObjects().filter((o) => o.selectable !== false && o.evented !== false);
      if (!objects.length) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        return;
      }
      if (objects.length === 1) {
        canvas.setActiveObject(objects[0]);
      } else {
        canvas.setActiveObject(new ActiveSelection(objects, { canvas }));
      }
      canvas.requestRenderAll();
    }, [readOnly]);

    const editMarkSelected = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const active = canvas.getActiveObject();
      if (!active) return;

      let textObj: IText | Textbox | null = null;
      if (active instanceof IText || active instanceof Textbox) {
        textObj = active;
      } else if (active instanceof Group) {
        const found = active.getObjects().find((o) => o instanceof Textbox || o instanceof IText);
        textObj = found instanceof Textbox || found instanceof IText ? found : null;
      } else if (active.group instanceof Group) {
        const found = active.group.getObjects().find((o) => o instanceof Textbox || o instanceof IText);
        textObj = found instanceof Textbox || found instanceof IText ? found : null;
      }

      if (!textObj || !("enterEditing" in textObj)) return;
      if (textObj.group) canvas.setActiveObject(textObj.group);
      textObj.enterEditing();
      if (textObj instanceof IText) textObj.selectAll();
      canvas.requestRenderAll();
    }, [readOnly]);

    const applyMarkFontSize = useCallback(
      (size: BoardMarkTextSize) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const active = canvas.getActiveObject();
        if (!active) return;
        const fontSize = MARK_TEXT_SIZES[size];

        if (active instanceof IText || active instanceof Textbox || active instanceof FabricText) {
          active.set("fontSize", fontSize);
        } else if (active instanceof Group) {
          const text = active.getObjects().find((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
          if (text instanceof Textbox || text instanceof IText || text instanceof FabricText) {
            text.set("fontSize", fontSize);
          } else {
            return;
          }
        } else {
          return;
        }

        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    const applyMarkColor = useCallback(
      (hex: string) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const selected = deleteTargetRef.current ?? canvas.getActiveObject();
        if (!selected) return;

        let root: FabricObject = selected;
        while (root.group) root = root.group;

        const isTextObject = (o: FabricObject) =>
          o instanceof IText ||
          o instanceof Textbox ||
          o instanceof FabricText ||
          o.type === "i-text" ||
          o.type === "textbox" ||
          o.type === "text";

        if (isTextObject(root)) {
          root.set("fill", hex);
        } else if (root.get("markKind") === "shape") {
          root.set({ stroke: hex, fill: `${hex}33` });
          drawColorRef.current = hex;
        } else if (root.get("markKind") === "draw" || root.type === "path") {
          root.set({ stroke: hex });
          drawColorRef.current = hex;
        } else if (root instanceof Group) {
          if (root.type === "activeSelection") {
            const text = root.getObjects().find(isTextObject);
            if (!text) return;
            text.set("fill", hex);
          } else {
            const rect = root.getObjects().find((o) => o instanceof Rect);
            const textbox = root.getObjects().find((o) => o instanceof Textbox);
            if (rect instanceof Rect && textbox instanceof Textbox) {
              rect.set({ fill: hex, stroke: hex });
            } else {
              const text = root.getObjects().find(isTextObject);
              if (!text) return;
              text.set("fill", hex);
            }
          }
        } else {
          return;
        }

        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    useEffect(() => {
      if (readOnly) return;
      const onKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)
        ) {
          return;
        }
        const canvas = fabricRef.current;
        const active = canvas?.getActiveObject() as { isEditing?: boolean } | undefined;
        if (active?.isEditing) return;
        if (!isActiveRef.current) return;
        if (drawingMode && e.key === "Escape") {
          e.preventDefault();
          exitDrawMode();
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          selectAllObjects();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
          e.preventDefault();
          void copySelected();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
          e.preventDefault();
          void pasteClipboard();
          return;
        }
        if (e.key !== "Delete" && e.key !== "Backspace") return;
        if (!canvas?.getActiveObjects().length) return;
        e.preventDefault();
        deleteSelected();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [copySelected, deleteSelected, drawingMode, exitDrawMode, pasteClipboard, readOnly, redo, selectAllObjects, undo]);

    useEffect(() => {
      if (isActive) return;
      exitDrawMode();
    }, [exitDrawMode, isActive]);

    const handleQuickPick = useCallback(
      (action: BoardMarksQuickAction) => {
        if (!quickSelector) return;
        if (action === "delete") {
          deleteSelected();
          setQuickSelector(null);
          deleteTargetRef.current = null;
          return;
        }
        if (action === "copy") {
          void copySelected();
          setQuickSelector(null);
          deleteTargetRef.current = null;
          return;
        }
        const { normX, normY } = quickSelector;
        setQuickSelector(null);
        deleteTargetRef.current = null;
        if (action === "statement") addTextAtPoint(normX, normY);
        else if (action === "sticky") addStickyNoteAtPoint(normX, normY);
        else if (action === "image") onRequestImagePick?.();
        else if (action === "draw") startDrawMode();
        else if (action === "edit") editMarkSelected();
        else if (action === "paste") void pasteAtPoint(normX, normY);
      },
      [
        addStickyNoteAtPoint,
        addTextAtPoint,
        copySelected,
        deleteSelected,
        editMarkSelected,
        onRequestImagePick,
        pasteAtPoint,
        quickSelector,
        startDrawMode,
      ],
    );

    const handleShapePick = useCallback(
      (shapeType: BoardMarkShapeType) => {
        if (!quickSelector) return;
        if (quickSelector.mode === "object") {
          swapMarkShape(shapeType);
        } else {
          addShapeAtPoint(shapeType, quickSelector.normX, quickSelector.normY);
        }
        setQuickSelector(null);
        deleteTargetRef.current = null;
      },
      [addShapeAtPoint, quickSelector, swapMarkShape],
    );

    const handleStickerPick = useCallback(
      (stickerId: BoardMarkStickerId) => {
        if (!quickSelector) return;
        if (quickSelector.mode === "object") {
          swapMarkSticker(stickerId);
        } else {
          addStickerAtPoint(stickerId, quickSelector.normX, quickSelector.normY);
        }
        setQuickSelector(null);
        deleteTargetRef.current = null;
      },
      [addStickerAtPoint, quickSelector, swapMarkSticker],
    );

    useEffect(() => {
      if (!quickSelector) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeQuickSelector();
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [closeQuickSelector, quickSelector]);

    useEffect(() => {
      if (readOnly) return;
      const wrap = canvasWrapRef.current;
      if (!wrap) return;

      let longPressTimer: number | undefined;
      let touchStartX = 0;
      let touchStartY = 0;

      const onTouchStart = (e: TouchEvent) => {
        if (!isActiveRef.current) return;
        if (fabricRef.current?.isDrawingMode) return;
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        longPressTimer = window.setTimeout(() => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          if (navigator.vibrate) navigator.vibrate(10);
          openQuickSelectorRef.current(canvas, e, canvas.findTarget(e) ?? undefined);
        }, 420);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!longPressTimer || !e.touches[0]) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (dx * dx + dy * dy > 64) {
          window.clearTimeout(longPressTimer);
          longPressTimer = undefined;
        }
      };

      const onTouchEnd = () => {
        if (longPressTimer) window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      };

      wrap.addEventListener("touchstart", onTouchStart, { passive: true });
      wrap.addEventListener("touchmove", onTouchMove, { passive: true });
      wrap.addEventListener("touchend", onTouchEnd);
      wrap.addEventListener("touchcancel", onTouchEnd);

      return () => {
        if (longPressTimer) window.clearTimeout(longPressTimer);
        wrap.removeEventListener("touchstart", onTouchStart);
        wrap.removeEventListener("touchmove", onTouchMove);
        wrap.removeEventListener("touchend", onTouchEnd);
        wrap.removeEventListener("touchcancel", onTouchEnd);
      };
    }, [readOnly]);

    useImperativeHandle(ref, () => ({
      addText,
      addTextAt,
      addTextNormalized,
      addStickyNote,
      addStickyNoteAt,
      addDiagramOverlay,
      addImageFromUrl,
      addImageFromFile,
      mergeLayoutObjects,
      copySelected,
      pasteClipboard,
      pasteAtPoint,
      canPasteClipboard,
      hasSelection,
      deleteSelected,
      resetBoard,
      undo,
      redo,
      canUndo,
      canRedo,
      getLayoutJson: () => (fabricRef.current?.toJSON() as Record<string, unknown>) ?? {},
      addShape: (shape) => addShapeAtPoint(shape, 0.5, 0.5),
      addSticker: (sticker) => addStickerAtPoint(sticker, 0.5, 0.5),
      startDrawMode,
    }), [addDiagramOverlay, addImageFromFile, addImageFromUrl, addShapeAtPoint, addStickerAtPoint, addStickyNote, addStickyNoteAt, addText, addTextAt, addTextNormalized, canPasteClipboard, canRedo, canUndo, copySelected, deleteSelected, hasSelection, mergeLayoutObjects, pasteAtPoint, pasteClipboard, redo, resetBoard, startDrawMode, undo]);

    return (
      <div
        ref={containerRef}
        style={embedded ? { backgroundColor: boardFillForKey(colorKey) } : undefined}
        className={cn(
          "board-artboard-host h-full w-full",
          embedded
            ? "min-h-0 overflow-hidden p-0"
            : "flex min-h-[420px] items-center justify-center bg-[#ebe8e3] p-4",
        )}
      >
        <div
          ref={canvasWrapRef}
          className={cn(
            "relative h-full w-full overflow-hidden",
            embedded ? "flex items-start justify-center" : "min-h-[140px] rounded-sm shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)]",
          )}
        >
          <canvas ref={canvasElRef} />
          {!readOnly && isActive && drawingMode && (
            <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-stone-300/80 bg-white/95 px-3 py-1 text-[11px] font-medium text-stone-700 shadow-sm">
              Esc to finish
            </div>
          )}
          {!readOnly && isActive && quickSelector && (
            <BoardMarksQuickSelector
              x={quickSelector.x}
              y={quickSelector.y}
              mode={quickSelector.mode}
              textCapable={quickSelector.textCapable}
              shapeCapable={quickSelector.shapeCapable}
              stickerCapable={quickSelector.stickerCapable}
              canPaste={canPasteClipboard()}
              onPick={handleQuickPick}
              onClose={closeQuickSelector}
              boardColorOptions={BOARD_QUICK_PICK_COLORS}
              activeBoardFill={boardFillForKey(colorKey)}
              onBoardColorPick={onBoardColorPick}
              onElementColorPick={applyMarkColor}
              onElementSizePick={applyMarkFontSize}
              onShapePick={handleShapePick}
              onStickerPick={handleStickerPick}
            />
          )}
        </div>
      </div>
    );
  },
);
```

## Desktop grid

```tsx
// src/components/boards/BoardDesktopGrid.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import { ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";

import {
  BoardCanvasEditor,
  ARTBOARD_HEIGHT,
  ARTBOARD_WIDTH,
  type BoardCanvasHandle,
} from "@/components/boards/BoardCanvasEditor";

import type { BoardZoomPreset } from "@/components/boards/BoardToolbar";

import { boardFillForKey } from "@/lib/boards/colors";

import { STANDARD_BOARD_COUNT } from "@/lib/boards/starterTemplates";

import type { Board } from "@/lib/boards/types";

import { BoardEditableTitle } from "@/components/boards/BoardEditableTitle";

import { cn } from "@/lib/utils";



const GRID_GAP_PX = 10;

const GRID_PAD_PX = 8;

const ADD_BTN_WIDTH_PX = 40;

const TITLE_BAR_PX = 32;

const MIN_CELL_WIDTH_PX = 120;

type RegisteredBoardCanvasEditorProps = ComponentProps<typeof BoardCanvasEditor> & {
  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;
};

function RegisteredBoardCanvasEditor({
  boardId,
  registerEditor,
  ...rest
}: RegisteredBoardCanvasEditorProps) {
  const setRef = useCallback(
    (handle: BoardCanvasHandle | null) => registerEditor(boardId, handle),
    [boardId, registerEditor],
  );
  return <BoardCanvasEditor ref={setRef} {...rest} />;
}

type CellSize = { width: number; height: number };



type BoardDesktopGridProps = {

  boards: Board[];

  activeId: string;

  onSelect: (id: string) => void;

  onSave: (boardId: string, layout: Record<string, unknown>) => void;

  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;

  onAddBoard?: () => void;

  onRenameBoard: (boardId: string, title: string) => void | Promise<void>;

  onTitleStyleChange: (
    boardId: string,
    patch: { title_color?: string | null; title_font?: string | null },
  ) => void | Promise<void>;

  zoomPreset: BoardZoomPreset;

  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;

  onReorderBoards?: (fromIndex: number, toIndex: number) => void;

};



export function BoardDesktopGrid({

  boards,

  activeId,

  onSelect,

  onSave,

  registerEditor,

  onAddBoard,

  onRenameBoard,

  onTitleStyleChange,

  zoomPreset,

  onHistoryChange,

  onReorderBoards,

}: BoardDesktopGridProps) {

  const saveHandlers = useRef(new Map<string, (layout: Record<string, unknown>) => void>());

  const gridRef = useRef<HTMLDivElement>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  const [cellSize, setCellSize] = useState<CellSize>({ width: 200, height: 280 });

  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const [dragBoardId, setDragBoardId] = useState<string | null>(null);

  const [dropBoardId, setDropBoardId] = useState<string | null>(null);



  const getSaveHandler = useCallback(
    (boardId: string) => {
      if (!saveHandlers.current.has(boardId)) {
        saveHandlers.current.set(boardId, (layout) => onSave(boardId, layout));
      }
      return saveHandlers.current.get(boardId)!;
    },
    [onSave],
  );



  const updateScrollHints = useCallback(() => {

    const el = viewportRef.current;

    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 4);

    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);

  }, []);



  useLayoutEffect(() => {

    const grid = gridRef.current;

    const viewport = viewportRef.current;

    if (!grid || !viewport) return;



    const measure = () => {

      const availW = viewport.clientWidth - GRID_PAD_PX * 2;

      const availH = grid.clientHeight - GRID_PAD_PX * 2;

      const addReserve = onAddBoard ? ADD_BTN_WIDTH_PX + GRID_GAP_PX : 0;

      const boardGaps = GRID_GAP_PX * Math.max(STANDARD_BOARD_COUNT - 1, 0);



      const maxWFromWidth = (availW - addReserve - boardGaps) / STANDARD_BOARD_COUNT;

      const canvasAvailH = Math.max(availH - TITLE_BAR_PX, 160);

      const multiplier = zoomPreset === "fit" ? 1 : zoomPreset;



      // Fixed slot width for four standard boards; fill almost all vertical space.

      let cellWidth = maxWFromWidth * multiplier;

      let cellHeight = canvasAvailH * multiplier;



      if (cellWidth * STANDARD_BOARD_COUNT + boardGaps + addReserve > availW) {

        cellWidth = maxWFromWidth;

      }



      setCellSize({

        width: Math.max(MIN_CELL_WIDTH_PX, Math.round(cellWidth)),

        height: Math.max(Math.round(cellWidth * (ARTBOARD_HEIGHT / ARTBOARD_WIDTH)), Math.round(cellHeight)),

      });

    };



    measure();

    const observer = new ResizeObserver(() => {

      measure();

      updateScrollHints();

    });

    observer.observe(grid);

    observer.observe(viewport);

    window.addEventListener("resize", measure);

    return () => {

      observer.disconnect();

      window.removeEventListener("resize", measure);

    };

  }, [onAddBoard, updateScrollHints, zoomPreset]);



  useEffect(() => {

    updateScrollHints();

  }, [boards.length, cellSize.width, updateScrollHints]);



  useEffect(() => {

    const viewport = viewportRef.current;

    if (!viewport) return;

    const activeEl = viewport.querySelector(`[data-board-id="${activeId}"]`);

    activeEl?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });

  }, [activeId, cellSize.width]);



  const scrollByPage = (direction: -1 | 1) => {

    const el = viewportRef.current;

    if (!el) return;

    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.6, cellSize.width), behavior: "smooth" });

  };



  const rowHeight = cellSize.height + TITLE_BAR_PX;

  const rowScrollWidth =

    boards.length * cellSize.width +

    Math.max(boards.length - 1, 0) * GRID_GAP_PX +

    (onAddBoard ? ADD_BTN_WIDTH_PX + GRID_GAP_PX : 0);



  return (

    <div ref={gridRef} className="board-desktop-grid flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

      <div className="relative min-h-0 flex-1 overflow-hidden">

        {canScrollLeft && (

          <button

            type="button"

            aria-label="Scroll boards left"

            onClick={() => scrollByPage(-1)}

            className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm hover:bg-white"

          >

            <ChevronLeft className="h-4 w-4" />

          </button>

        )}

        {canScrollRight && (

          <button

            type="button"

            aria-label="Scroll boards right"

            onClick={() => scrollByPage(1)}

            className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm hover:bg-white"

          >

            <ChevronRight className="h-4 w-4" />

          </button>

        )}



        <div

          ref={viewportRef}

          className="board-row-scroll flex h-full flex-col overflow-x-auto overflow-y-hidden scroll-smooth p-2"

          onScroll={updateScrollHints}

          onWheel={(e) => {

            const el = viewportRef.current;

            if (!el || el.scrollWidth <= el.clientWidth) return;

            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {

              el.scrollLeft += e.deltaY;

              e.preventDefault();

            }

          }}

        >

          <div

            className="flex min-h-full flex-row flex-nowrap items-stretch gap-2.5"

            style={{ width: rowScrollWidth, minHeight: rowHeight, height: rowHeight }}

          >

            {boards.map((board, boardIndex) => {

              const active = board.id === activeId;
              const canReorder = !!onReorderBoards && boards.length > 1;
              const isDropTarget = dropBoardId === board.id && dragBoardId !== board.id;

              return (

                <div

                  key={board.id}

                  data-board-id={board.id}

                  role="button"

                  tabIndex={0}

                  onClick={() => onSelect(board.id)}

                  onKeyDown={(e) => {

                    if (e.key === "Enter" || e.key === " ") {

                      e.preventDefault();

                      onSelect(board.id);

                    }

                  }}

                  onDragOver={
                    canReorder
                      ? (e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDropBoardId(board.id);
                        }
                      : undefined
                  }

                  onDragLeave={
                    canReorder
                      ? () => {
                          setDropBoardId((prev) => (prev === board.id ? null : prev));
                        }
                      : undefined
                  }

                  onDrop={
                    canReorder
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fromId = e.dataTransfer.getData("text/board-id");
                          const fromIndex = boards.findIndex((b) => b.id === fromId);
                          if (fromIndex >= 0 && fromIndex !== boardIndex) {
                            onReorderBoards(fromIndex, boardIndex);
                          }
                          setDragBoardId(null);
                          setDropBoardId(null);
                        }
                      : undefined
                  }

                  style={{ width: cellSize.width, height: rowHeight }}

                  className={cn(

                    "board-grid-cell flex shrink-0 flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-shadow",

                    active ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200 hover:border-neutral-300",

                    isDropTarget && "border-neutral-500 ring-2 ring-neutral-400/30",

                  )}

                >

                  <div

                    className="flex h-8 shrink-0 items-center justify-between gap-1 border-b border-neutral-100 px-1.5"

                    style={{ backgroundColor: boardFillForKey(board.color_key) }}

                  >

                    {canReorder ? (
                      <button
                        type="button"
                        draggable
                        aria-label={`Drag to reorder ${board.title}`}
                        className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-neutral-500 hover:bg-black/5 hover:text-neutral-800 active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/board-id", board.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragBoardId(board.id);
                        }}
                        onDragEnd={() => {
                          setDragBoardId(null);
                          setDropBoardId(null);
                        }}
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                    ) : null}

                    <BoardEditableTitle

                      boardId={board.id}

                      title={board.title}

                      headerFill={boardFillForKey(board.color_key)}

                      titleColor={board.title_color}

                      titleFont={board.title_font}

                      onRename={onRenameBoard}

                      onStyleChange={onTitleStyleChange}

                      showStyleControls={active}

                      className="min-w-0 flex-1 text-[11px] font-semibold"

                      inputClassName="w-full text-[11px] font-semibold"

                    />

                    {board.role === "plan" && (

                      <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-neutral-800">

                        Plan

                      </span>

                    )}

                  </div>

                  <div className="relative min-h-0 flex-1 overflow-hidden" style={{ height: cellSize.height }}>

                    <RegisteredBoardCanvasEditor
                      boardId={board.id}
                      registerEditor={registerEditor}
                      colorKey={board.color_key}
                      layoutMode={board.layout_mode ?? "vision"}
                      layoutJson={board.layout_json}
                      onSave={getSaveHandler(board.id)}
                      onHistoryChange={board.id === activeId ? onHistoryChange : undefined}
                      isActive={board.id === activeId}
                      embedded
                      cellFit="cover"
                      viewZoom="fit"
                    />

                  </div>

                </div>

              );

            })}



            {onAddBoard && (

              <button

                type="button"

                onClick={onAddBoard}

                title="Add focus board"

                style={{ width: ADD_BTN_WIDTH_PX, height: rowHeight }}

                className="flex shrink-0 flex-col items-center justify-center self-stretch rounded-lg border border-dashed border-neutral-300 bg-white/40 text-neutral-500 transition-colors hover:border-neutral-500 hover:bg-white hover:text-neutral-900"

              >

                <Plus className="h-5 w-5" />

              </button>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}
```

## Plotting workbench (left dock)

```tsx
// src/components/boards/BoardPlottingWorkbench.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useRef, useState } from "react";
import type { RefObject } from "react";
import {
  BookImage,
  ChevronLeft,
  ChevronRight,
  MessageCircleHeart,
  PenLine,
  Shapes,
  StickyNote,
  Type,
} from "lucide-react";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import {
  BOARD_MARK_SHAPE_OPTIONS,
  BOARD_MARK_STICKER_OPTIONS,
} from "@/components/boards/BoardMarksQuickSelector";
import { BoardColorStrip } from "@/components/boards/BoardColorStrip";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

export type PlotDockTab = "companion" | "clippings" | "structures" | "marks";

export const PLOT_STRUCTURES: {
  type: BoardDiagramType;
  title: string;
  items?: string[];
}[] = [
  { type: "checklist", title: "Checklist" },
  { type: "divider", title: "Divider" },
  { type: "zones", title: "Zones" },
  { type: "eisenhower", title: "Priority grid" },
  { type: "kanban", title: "Flow columns" },
  { type: "timeline", title: "Timeline" },
];

export const STRUCTURE_DECAL_SIZE: Record<BoardDiagramType, { x: number; y: number; w: number; h: number }> = {
  checklist: { x: 0.14, y: 0.2, w: 0.62, h: 0.34 },
  divider: { x: 0.12, y: 0.46, w: 0.76, h: 0.02 },
  zones: { x: 0.12, y: 0.24, w: 0.68, h: 0.24 },
  eisenhower: { x: 0.14, y: 0.18, w: 0.62, h: 0.44 },
  kanban: { x: 0.1, y: 0.28, w: 0.78, h: 0.18 },
  timeline: { x: 0.1, y: 0.34, w: 0.78, h: 0.16 },
  gantt: { x: 0.12, y: 0.26, w: 0.72, h: 0.26 },
  okrs: { x: 0.14, y: 0.24, w: 0.66, h: 0.28 },
  five_s: { x: 0.1, y: 0.34, w: 0.78, h: 0.12 },
};

const decalInk = "bg-neutral-900";

export function StructureDecalPreview({ type }: { type: BoardDiagramType }) {
  if (type === "kanban") {
    return (
      <div className="mt-2 flex h-8 items-end gap-0 border-b border-neutral-900/70 pb-0.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative flex flex-1 flex-col items-center gap-0.5">
            {i > 0 && <span className={`absolute bottom-0 left-0 top-0 w-px ${decalInk}`} />}
            <span className={`h-0.5 w-4/5 ${decalInk}`} />
          </div>
        ))}
      </div>
    );
  }
  if (type === "divider") {
    return (
      <div className="mt-3 flex h-6 items-center px-1">
        <span className={`block h-0.5 w-full ${decalInk}`} />
      </div>
    );
  }
  if (type === "checklist") {
    return (
      <div className="mt-2 space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 border border-neutral-900/80" />
            <span className="h-px flex-1 border-b border-dashed border-neutral-400/70" />
          </div>
        ))}
      </div>
    );
  }
  if (type === "eisenhower") {
    return (
      <div className="mt-2">
        <div className="relative h-4 border-b border-neutral-900/70">
          <span className={`absolute left-[55%] top-0 h-full w-px ${decalInk}`} />
        </div>
        <div className="mt-1 space-y-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-px flex-1 border-b border-dashed border-neutral-400/70" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === "timeline") {
    return (
      <div className="relative mt-3 h-4">
        <span className={`absolute left-0 top-1/2 h-px w-full -translate-y-1/2 ${decalInk}`} />
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`absolute top-0 h-2 w-px ${decalInk}`}
            style={{ left: `${i * 33}%` }}
          />
        ))}
      </div>
    );
  }
  if (type === "zones") {
    return (
      <div className="mt-2 space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <span className={`h-px w-3 ${decalInk} opacity-50`} />
            <span className={`h-px flex-1 ${decalInk} opacity-30`} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const DOCK_TABS: { id: PlotDockTab; label: string; Icon: typeof Type }[] = [
  { id: "companion", label: "Guide", Icon: MessageCircleHeart },
  { id: "clippings", label: "Images", Icon: BookImage },
  { id: "structures", label: "Layouts", Icon: Shapes },
  { id: "marks", label: "Marks", Icon: PenLine },
];

const TAB_INTROS: Record<PlotDockTab, string> = {
  companion: "Tell me the feeling of this board — I'll plot color, words, and structures with you.",
  clippings: "Browse Our Collection or add photos to Your Library.",
  structures: "Drop planning grids onto the board — mix freely on any board.",
  marks: "Right-click empty board to add marks · right-click a note to edit.",
};

type BoardPlottingWorkbenchProps = {
  workspaceId: string;
  activeBoard: Board;
  activeBoardId: string;
  editorRef: RefObject<BoardCanvasHandle | null>;
  userId: string;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onPickImage: (url: string) => void;
};

export function BoardPlottingWorkbench({
  workspaceId,
  activeBoard,
  activeBoardId,
  editorRef,
  userId,
  onBoardColorChange,
  onPickImage,
}: BoardPlottingWorkbenchProps) {
  const [openTab, setOpenTab] = useState<PlotDockTab | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const lastOpenTabRef = useRef<PlotDockTab | null>(null);
  const activeBoardFill = boardFillForKey(activeBoard.color_key);

  const showTab = (tab: PlotDockTab) => {
    lastOpenTabRef.current = tab;
    setOpenTab(tab);
  };

  const pickTab = (tab: PlotDockTab) => {
    if (collapsed) {
      setCollapsed(false);
      showTab(tab);
      return;
    }
    if (openTab === tab) {
      setOpenTab(null);
      return;
    }
    showTab(tab);
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      if (prev) {
        setOpenTab((current) => current ?? lastOpenTabRef.current);
      }
      return !prev;
    });
  };

  const placeStructure = (type: BoardDiagramType, items?: string[]) => {
    const placement = STRUCTURE_DECAL_SIZE[type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
    editorRef.current?.addDiagramOverlay(type, placement.x, placement.y, placement.w, placement.h, items);
    setOpenTab(null);
  };

  const markBtn =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-200/60";

  const boardColorStrip = (
    <BoardColorStrip
      userId={userId}
      activeBoardFill={activeBoardFill}
      onColorChange={(hex) => void onBoardColorChange(activeBoardId, hex)}
      className="px-3 py-2"
    />
  );

  return (
    <div className="flex h-full min-h-0 max-h-full shrink-0 self-stretch border-r border-stone-300/80 bg-[#f3f0eb]">
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-stone-300/60 py-1"
        aria-label="Plotting desk"
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-5 w-5 items-center justify-center text-stone-500 hover:text-stone-900"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
        {DOCK_TABS.map(({ id, label, Icon }) => {
          const active = !collapsed && openTab === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-pressed={active}
              onClick={() => pickTab(id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-transparent text-stone-900 ring-2 ring-stone-900 ring-offset-1 ring-offset-[#f3f0eb]"
                  : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
            </button>
          );
        })}
      </nav>

      {!collapsed && openTab ? (
        <div className="flex h-full min-h-0 w-[min(100vw,17.5rem)] flex-col overflow-hidden xl:w-72">
          <header className="border-b border-stone-300/60 px-3 py-2.5">
            <p className="font-welcome-serif text-sm font-normal text-stone-900">
              {DOCK_TABS.find((t) => t.id === openTab)?.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{TAB_INTROS[openTab]}</p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {openTab === "companion" && (
              <BoardCompanionPanel
                workspaceId={workspaceId}
                activeBoardId={activeBoardId}
                editorRef={editorRef}
                onBoardColorChange={onBoardColorChange}
              />
            )}

            <div className={cn("min-h-0 flex-1", openTab !== "clippings" && "hidden")}>
              <BoardImagePicker embedded userId={userId} onPickImage={onPickImage} />
            </div>

            {openTab === "structures" && (
              <div className="flex-1 overflow-y-auto">
                {boardColorStrip}
                <div className="p-2">
                  <div className="grid gap-1.5">
                    {PLOT_STRUCTURES.map((s) => (
                      <button
                        key={s.type}
                        type="button"
                        onClick={() => placeStructure(s.type, s.items)}
                        className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-3 py-2 text-left hover:border-stone-500/50 hover:bg-white"
                      >
                        <span className="text-xs font-semibold text-stone-900">{s.title}</span>
                        <StructureDecalPreview type={s.type} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {openTab === "marks" && (
              <div className="flex-1 space-y-3 overflow-y-auto p-2">
                <div className="rounded-lg border border-stone-300/70 bg-white/60 p-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Text & notes</p>
                  <div className="mt-1 space-y-0.5">
                    <button type="button" className={markBtn} onClick={() => editorRef.current?.addText()}>
                      <Type className="h-4 w-4" /> Statement
                    </button>
                    <button type="button" className={markBtn} onClick={() => editorRef.current?.addStickyNote()}>
                      <StickyNote className="h-4 w-4" /> Sticky note
                    </button>
                    <button
                      type="button"
                      className={markBtn}
                      title="Esc to finish"
                      onClick={() => editorRef.current?.startDrawMode()}
                    >
                      <PenLine className="h-4 w-4" /> Freehand
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-stone-300/70 bg-white/60 p-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Shapes</p>
                  <div className="mt-1.5 grid grid-cols-4 gap-1">
                    {BOARD_MARK_SHAPE_OPTIONS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        className="flex flex-col items-center gap-0.5 rounded-md border border-stone-200 bg-[#faf8f5] px-1 py-1.5 text-[9px] font-medium text-stone-700 hover:border-stone-400 hover:bg-white"
                        onClick={() => editorRef.current?.addShape(id)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-stone-300/70 bg-white/60 p-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Stickers</p>
                  <div className="mt-1.5 grid grid-cols-6 gap-1">
                    {BOARD_MARK_STICKER_OPTIONS.map(({ id, label, emoji }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        className="flex flex-col items-center gap-0.5 rounded-md border border-stone-200 bg-[#faf8f5] px-1 py-1.5 text-lg hover:border-stone-400 hover:bg-white"
                        onClick={() => editorRef.current?.addSticker(id)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

## Plot kit tray (mobile dock)

```tsx
// src/components/boards/BoardPlotKitTray.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useState } from "react";
import type { RefObject } from "react";
import { BookImage, MessageCircleHeart, Shapes } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { BoardColorStrip } from "@/components/boards/BoardColorStrip";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { PLOT_STRUCTURES, STRUCTURE_DECAL_SIZE, StructureDecalPreview, type PlotDockTab } from "@/components/boards/BoardPlottingWorkbench";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<PlotDockTab, string> = {
  companion: "Guide",
  clippings: "Images",
  structures: "Structures",
  marks: "Marks",
};

type BoardPlotKitTrayProps = {
  workspaceId: string;
  activeBoard: Board;
  activeBoardId: string;
  editorRef: RefObject<BoardCanvasHandle | null>;
  userId: string;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onPickImage: (url: string) => void;
};

export function BoardPlotKitTray({
  workspaceId,
  activeBoard,
  activeBoardId,
  editorRef,
  userId,
  onBoardColorChange,
  onPickImage,
}: BoardPlotKitTrayProps) {
  const [sheetTab, setSheetTab] = useState<PlotDockTab | null>(null);
  const close = () => setSheetTab(null);
  const activeBoardFill = boardFillForKey(activeBoard.color_key);

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-stone-300/80 bg-[#f3f0eb]/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-sm"
        role="toolbar"
        aria-label="Plotting kit"
      >
        {(
          [
            { id: "companion" as const, Icon: MessageCircleHeart },
            { id: "clippings" as const, Icon: BookImage },
            { id: "structures" as const, Icon: Shapes },
          ] as const
        ).map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSheetTab(id)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium",
              sheetTab === id ? "text-stone-900" : "text-stone-600",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            <span className="truncate">{TAB_LABELS[id]}</span>
          </button>
        ))}
      </div>

      <Sheet open={sheetTab !== null} onOpenChange={(o) => !o && close()}>
        <SheetContent side="bottom" className="max-h-[min(70vh,520px)] rounded-t-2xl border-stone-300 bg-[#f3f0eb] p-0">
          <SheetHeader className="border-b border-stone-300/60 px-4 py-3 text-left">
            <SheetTitle className="font-welcome-serif text-base font-normal text-stone-900">
              {sheetTab ? TAB_LABELS[sheetTab] : "Plotting kit"}
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto pb-4" style={{ maxHeight: "calc(min(70vh, 520px) - 3.5rem)" }}>
            {sheetTab === "companion" && (
              <BoardCompanionPanel
                workspaceId={workspaceId}
                activeBoardId={activeBoardId}
                editorRef={editorRef}
                onBoardColorChange={onBoardColorChange}
                compact
              />
            )}

            {sheetTab === "clippings" && (
              <div className="h-[min(48vh,360px)]">
                <BoardImagePicker
                  embedded
                  userId={userId}
                  onPickImage={(url) => {
                    onPickImage(url);
                    close();
                  }}
                />
              </div>
            )}

            {sheetTab === "structures" && (
              <>
                <BoardColorStrip
                  userId={userId}
                  activeBoardFill={activeBoardFill}
                  onColorChange={(hex) => void onBoardColorChange(activeBoardId, hex)}
                  className="px-4 py-3"
                  swatchSize="md"
                />
                <div className="grid gap-2 p-3">
                  {PLOT_STRUCTURES.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() => {
                        const placement = STRUCTURE_DECAL_SIZE[s.type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
                        editorRef.current?.addDiagramOverlay(
                          s.type,
                          placement.x,
                          placement.y,
                          placement.w,
                          placement.h,
                          s.items,
                        );
                        close();
                      }}
                      className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-3 py-3 text-left active:bg-white"
                    >
                      <span className="text-sm font-semibold text-stone-900">{s.title}</span>
                      <StructureDecalPreview type={s.type} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {sheetTab === "marks" && (
              <div className="space-y-3 p-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-stone-300 bg-[#faf8f5] py-3 text-sm font-medium text-stone-900"
                    onClick={() => {
                      editorRef.current?.addText();
                      close();
                    }}
                  >
                    Statement
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-stone-300 bg-[#faf8f5] py-3 text-sm font-medium text-stone-900"
                    onClick={() => {
                      editorRef.current?.addStickyNote();
                      close();
                    }}
                  >
                    Sticky
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">
                  Right-click, tap empty board space, or hold on mobile for the marks wheel.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

## Mobile carousel

```tsx
// src/components/boards/BoardMobileCarousel.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useCallback, useEffect, useRef, type ComponentProps } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardCanvasEditor, type BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import { BoardEditableTitle } from "@/components/boards/BoardEditableTitle";
import { cn } from "@/lib/utils";

type BoardMobileCarouselProps = {
  boards: Board[];
  activeId: string;
  onSelect: (id: string) => void;
  onSave: (boardId: string, layout: Record<string, unknown>) => void;
  onAddBoard: () => void;
  onRemoveBoard?: () => void;
  canRemoveBoard?: boolean;
  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;
  onRenameBoard: (boardId: string, title: string) => void | Promise<void>;
  onTitleStyleChange: (
    boardId: string,
    patch: { title_color?: string | null; title_font?: string | null },
  ) => void | Promise<void>;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onBoardColorChange?: (boardId: string, colorKey: string) => void | Promise<void>;
  onRequestImagePick?: () => void;
  onMoveBoard?: (boardId: string, direction: -1 | 1) => void;
};

type RegisteredBoardCanvasEditorProps = ComponentProps<typeof BoardCanvasEditor> & {
  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;
};

function RegisteredBoardCanvasEditor({
  boardId,
  registerEditor,
  ...rest
}: RegisteredBoardCanvasEditorProps) {
  const setRef = useCallback(
    (handle: BoardCanvasHandle | null) => registerEditor(boardId, handle),
    [boardId, registerEditor],
  );
  return <BoardCanvasEditor ref={setRef} {...rest} />;
}

export function BoardMobileCarousel({
  boards,
  activeId,
  onSelect,
  onSave,
  onAddBoard,
  onRemoveBoard,
  canRemoveBoard = false,
  registerEditor,
  onRenameBoard,
  onTitleStyleChange,
  onHistoryChange,
  onBoardColorChange,
  onRequestImagePick,
  onMoveBoard,
}: BoardMobileCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveHandlers = useRef(new Map<string, (layout: Record<string, unknown>) => void>());
  const scrollingProgrammatically = useRef(false);

  const getSaveHandler = useCallback(
    (boardId: string) => {
      if (!saveHandlers.current.has(boardId)) {
        saveHandlers.current.set(boardId, (layout) => onSave(boardId, layout));
      }
      return saveHandlers.current.get(boardId)!;
    },
    [onSave],
  );

  const activeIndex = Math.max(0, boards.findIndex((b) => b.id === activeId));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || boards.length === 0) return;
    const child = el.children[activeIndex] as HTMLElement | undefined;
    if (!child) return;
    scrollingProgrammatically.current = true;
    child.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    const t = window.setTimeout(() => {
      scrollingProgrammatically.current = false;
    }, 400);
    return () => window.clearTimeout(t);
  }, [activeIndex, boards.length]);

  const handleScroll = useCallback(() => {
    if (scrollingProgrammatically.current) return;
    const el = scrollRef.current;
    if (!el || boards.length === 0) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - childCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    const next = boards[bestIdx];
    if (next && next.id !== activeId) onSelect(next.id);
  }, [activeId, boards, onSelect]);

  return (
    <div className="board-mobile-carousel relative flex h-0 min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-0 min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {boards.map((board) => (
          <div
            key={board.id}
            className="flex h-full w-full shrink-0 snap-center flex-col"
          >
            <div
              className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-2 py-2"
              style={{ backgroundColor: boardFillForKey(board.color_key) }}
            >
              {onMoveBoard && board.id === activeId && boards.length > 1 ? (
                <button
                  type="button"
                  aria-label="Move board left"
                  disabled={activeIndex === 0}
                  onClick={() => onMoveBoard(board.id, -1)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-600 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <span className="w-8 shrink-0" />
              )}
              <BoardEditableTitle
                boardId={board.id}
                title={board.title}
                headerFill={boardFillForKey(board.color_key)}
                titleColor={board.title_color}
                titleFont={board.title_font}
                onRename={onRenameBoard}
                onStyleChange={onTitleStyleChange}
                showStyleControls={board.id === activeId}
                className="min-w-0 flex-1 text-center text-sm font-semibold"
                inputClassName="w-full text-center text-sm font-semibold"
              />
              {onMoveBoard && board.id === activeId && boards.length > 1 ? (
                <button
                  type="button"
                  aria-label="Move board right"
                  disabled={activeIndex === boards.length - 1}
                  onClick={() => onMoveBoard(board.id, 1)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-600 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : board.role === "plan" ? (
                <span className="shrink-0 rounded bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Plan
                </span>
              ) : (
                <span className="w-8 shrink-0" />
              )}
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden px-1 pb-1">
              <RegisteredBoardCanvasEditor
                boardId={board.id}
                registerEditor={registerEditor}
                colorKey={board.color_key}
                layoutMode={board.layout_mode ?? "vision"}
                layoutJson={board.layout_json}
                onSave={getSaveHandler(board.id)}
                onHistoryChange={board.id === activeId ? onHistoryChange : undefined}
                isActive={board.id === activeId}
                embedded
                cellFit="cover"
                onBoardColorPick={(hex) => void onBoardColorChange?.(board.id, hex)}
                onRequestImagePick={board.id === activeId ? onRequestImagePick : undefined}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-1.5 border-t border-neutral-100 bg-white py-1.5">
        {boards.map((board, i) => (
          <button
            key={board.id}
            type="button"
            aria-label={`Go to ${board.title}`}
            onClick={() => onSelect(board.id)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === activeIndex ? "w-5 bg-neutral-900" : "w-2 bg-neutral-300",
            )}
          />
        ))}
        <Button
          variant="outline"
          size="icon"
          className="ml-2 h-8 w-8 rounded-full border-dashed"
          onClick={onAddBoard}
          aria-label="Add focus board"
        >
          <Plus className="h-4 w-4" />
        </Button>
        {canRemoveBoard && onRemoveBoard && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-red-600"
            onClick={onRemoveBoard}
            aria-label="Remove this board"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="shrink-0 pb-0.5 text-center text-[10px] text-neutral-400">
        Swipe boards · tap empty space to add · hold items to edit
      </p>
    </div>
  );
}
```

## Marks quick selector

```tsx
// src/components/boards/BoardMarksQuickSelector.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useEffect, useState } from "react";
import {
  ImagePlus,
  ChevronLeft,
  ClipboardCopy,
  ClipboardPaste,
  Palette,
  StickyNote,
  Trash2,
  Type,
  CaseSensitive,
  Pencil,
  Shapes,
  Sparkles,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Minus,
  Hexagon,
  Pentagon,
  Star,
  Diamond,
  ArrowRight,
  Heart,
  MessageCircle,
  Database,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BoardMarksQuickAction =
  | "statement"
  | "sticky"
  | "image"
  | "draw"
  | "shapes"
  | "stickers"
  | "edit"
  | "color"
  | "size"
  | "copy"
  | "paste"
  | "delete";

export type BoardMarkTextSize = "S" | "M" | "L" | "XL";

export type BoardMarkShapeType =
  | "rect"
  | "circle"
  | "triangle"
  | "line"
  | "hexagon"
  | "pentagon"
  | "star"
  | "diamond"
  | "arrow"
  | "heart"
  | "bubble"
  | "cylinder";

export type BoardMarkStickerId =
  | "star"
  | "heart"
  | "check"
  | "sparkles"
  | "target"
  | "fire"
  | "thumbsup"
  | "lightbulb"
  | "sun"
  | "moon"
  | "rainbow"
  | "flower"
  | "leaf"
  | "rocket"
  | "trophy"
  | "medal"
  | "bell"
  | "warning"
  | "exclamation"
  | "question"
  | "smile"
  | "party"
  | "music"
  | "bookmark";

export const BOARD_MARK_SHAPE_OPTIONS: {
  id: BoardMarkShapeType;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "rect", label: "Rect", Icon: Square },
  { id: "circle", label: "Circle", Icon: CircleIcon },
  { id: "triangle", label: "Triangle", Icon: TriangleIcon },
  { id: "line", label: "Line", Icon: Minus },
  { id: "hexagon", label: "Hex", Icon: Hexagon },
  { id: "pentagon", label: "Pent", Icon: Pentagon },
  { id: "star", label: "Star", Icon: Star },
  { id: "diamond", label: "Diamond", Icon: Diamond },
  { id: "arrow", label: "Arrow", Icon: ArrowRight },
  { id: "heart", label: "Heart", Icon: Heart },
  { id: "bubble", label: "Bubble", Icon: MessageCircle },
  { id: "cylinder", label: "Cylinder", Icon: Database },
];

/** Unicode emoji only — no third-party artwork; safe for commercial product use. */
export const BOARD_MARK_STICKER_OPTIONS: { id: BoardMarkStickerId; label: string; emoji: string }[] = [
  { id: "star", label: "Star", emoji: "⭐" },
  { id: "heart", label: "Heart", emoji: "❤️" },
  { id: "check", label: "Done", emoji: "✅" },
  { id: "sparkles", label: "Sparkles", emoji: "✨" },
  { id: "target", label: "Target", emoji: "🎯" },
  { id: "fire", label: "Fire", emoji: "🔥" },
  { id: "thumbsup", label: "Thumbs up", emoji: "👍" },
  { id: "lightbulb", label: "Idea", emoji: "💡" },
  { id: "sun", label: "Sun", emoji: "☀️" },
  { id: "moon", label: "Moon", emoji: "🌙" },
  { id: "rainbow", label: "Rainbow", emoji: "🌈" },
  { id: "flower", label: "Flower", emoji: "🌸" },
  { id: "leaf", label: "Growth", emoji: "🌿" },
  { id: "rocket", label: "Launch", emoji: "🚀" },
  { id: "trophy", label: "Trophy", emoji: "🏆" },
  { id: "medal", label: "Medal", emoji: "🏅" },
  { id: "bell", label: "Reminder", emoji: "🔔" },
  { id: "warning", label: "Warning", emoji: "⚠️" },
  { id: "exclamation", label: "Important", emoji: "❗" },
  { id: "question", label: "Question", emoji: "❓" },
  { id: "smile", label: "Smile", emoji: "😊" },
  { id: "party", label: "Celebrate", emoji: "🎉" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "bookmark", label: "Bookmark", emoji: "🔖" },
];

export const BOARD_MARK_STICKER_EMOJI: Record<BoardMarkStickerId, string> = Object.fromEntries(
  BOARD_MARK_STICKER_OPTIONS.map((s) => [s.id, s.emoji]),
) as Record<BoardMarkStickerId, string>;

type BoardMarksQuickSelectorProps = {
  x: number;
  y: number;
  mode: "empty" | "object";
  textCapable?: boolean;
  shapeCapable?: boolean;
  stickerCapable?: boolean;
  canPaste?: boolean;
  onPick: (action: BoardMarksQuickAction) => void;
  onClose: () => void;
  boardColorOptions?: { hex: string; label: string }[];
  activeBoardFill?: string;
  onBoardColorPick?: (hex: string) => void;
  onElementColorPick?: (hex: string) => void;
  onElementSizePick?: (size: BoardMarkTextSize) => void;
  onShapePick?: (shape: BoardMarkShapeType) => void;
  onStickerPick?: (sticker: BoardMarkStickerId) => void;
};

const TEXT_SIZE_OPTIONS: { id: BoardMarkTextSize; label: string }[] = [
  { id: "S", label: "S" },
  { id: "M", label: "M" },
  { id: "L", label: "L" },
  { id: "XL", label: "XL" },
];

const WHEEL = 176;
const CENTER = WHEEL / 2;
const ITEM_RADIUS = 54;
const SWATCH_RADIUS = 74;
const STICKER_INNER_RADIUS = 46;
const SHAPE_INNER_RADIUS = 46;

type WheelItem = {
  id: BoardMarksQuickAction;
  label: string;
  Icon: LucideIcon;
  accent?: string;
};

function spreadAngles(count: number, startDeg = -90): number[] {
  if (count <= 0) return [];
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => startDeg + i * step);
}

const EMPTY_ACTIONS: WheelItem[] = [
  { id: "statement", label: "Text", Icon: Type },
  { id: "image", label: "Image", Icon: ImagePlus },
  { id: "sticky", label: "Note", Icon: StickyNote },
  { id: "draw", label: "Draw", Icon: Pencil },
  { id: "shapes", label: "Shapes", Icon: Shapes },
  { id: "stickers", label: "Stickers", Icon: Sparkles },
  { id: "color", label: "Recolor", Icon: Palette },
];

const OBJECT_ACTIONS: WheelItem[] = [
  { id: "edit", label: "Edit", Icon: Type },
  { id: "size", label: "Size", Icon: CaseSensitive },
  { id: "shapes", label: "Shape", Icon: Shapes },
  { id: "stickers", label: "Sticker", Icon: Sparkles },
  { id: "copy", label: "Copy", Icon: ClipboardCopy },
  { id: "color", label: "Recolor", Icon: Palette },
  { id: "delete", label: "Delete", Icon: Trash2, accent: "text-red-300" },
];

export function BoardMarksQuickSelector({
  x,
  y,
  mode,
  textCapable = false,
  shapeCapable = false,
  stickerCapable = false,
  canPaste = false,
  onPick,
  onClose,
  boardColorOptions = [],
  activeBoardFill,
  onBoardColorPick,
  onElementColorPick,
  onElementSizePick,
  onShapePick,
  onStickerPick,
}: BoardMarksQuickSelectorProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const subMenuOpen = paletteOpen || sizeOpen || shapesOpen || stickersOpen;

  const wheelItems = (() => {
    if (mode === "object") {
      const actions = OBJECT_ACTIONS.filter((item) => {
        if (item.id === "size" || item.id === "edit") return textCapable;
        if (item.id === "shapes") return shapeCapable;
        if (item.id === "stickers") return stickerCapable;
        return true;
      });
      const angles = spreadAngles(actions.length);
      return actions.map((item, i) => ({ ...item, angle: angles[i] }));
    }
    const actions = [
      ...EMPTY_ACTIONS.slice(0, 6),
      ...(canPaste ? [{ id: "paste" as const, label: "Paste", Icon: ClipboardPaste }] : []),
      EMPTY_ACTIONS[6],
    ];
    const angles = spreadAngles(actions.length);
    return actions.map((item, i) => ({ ...item, angle: angles[i] }));
  })();

  const paletteLabel = mode === "empty" ? "Board color" : "Element color";
  const shapesLabel = mode === "empty" ? "Pick shape" : "Change shape";
  const stickersLabel = mode === "empty" ? "Pick sticker" : "Change sticker";

  const backToMain = () => {
    setPaletteOpen(false);
    setSizeOpen(false);
    setShapesOpen(false);
    setStickersOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (paletteOpen) setPaletteOpen(false);
      else if (sizeOpen) setSizeOpen(false);
      else if (shapesOpen) setShapesOpen(false);
      else if (stickersOpen) setStickersOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onClose, paletteOpen, sizeOpen, shapesOpen, stickersOpen]);

  const handleBackdropClick = () => {
    if (subMenuOpen) backToMain();
    else onClose();
  };

  const handleItemClick = (id: BoardMarksQuickAction) => {
    if (id === "color") {
      setSizeOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setPaletteOpen(true);
      return;
    }
    if (id === "size") {
      setPaletteOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setSizeOpen(true);
      return;
    }
    if (id === "shapes") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setStickersOpen(false);
      setShapesOpen(true);
      return;
    }
    if (id === "stickers") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setShapesOpen(false);
      setStickersOpen(true);
      return;
    }
    onPick(id);
  };

  const handleColorPick = (hex: string) => {
    if (mode === "empty") onBoardColorPick?.(hex);
    else onElementColorPick?.(hex);
    onClose();
  };

  const handleSizePick = (size: BoardMarkTextSize) => {
    onElementSizePick?.(size);
    onClose();
  };

  const handleShapePick = (shape: BoardMarkShapeType) => {
    onShapePick?.(shape);
    onClose();
  };

  const handleStickerPick = (sticker: BoardMarkStickerId) => {
    onStickerPick?.(sticker);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close marks selector"
        className="absolute inset-0 z-30 cursor-default bg-black/10 backdrop-blur-[1px]"
        onClick={handleBackdropClick}
      />
      <div
        className="board-marks-quick-selector pointer-events-none absolute z-40"
        style={{ left: x, top: y }}
        role="menu"
        aria-label="Marks quick selector"
      >
        <div
          className="pointer-events-auto relative -translate-x-1/2 -translate-y-1/2"
          style={{ width: WHEEL, height: WHEEL }}
        >
          <div className="absolute inset-0 rounded-full border border-white/10 bg-neutral-950/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-md" />
          {subMenuOpen ? (
            <button
              type="button"
              title="Back to menu"
              aria-label="Back to menu"
              onClick={(e) => {
                e.stopPropagation();
                backToMain();
              }}
              className="absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
          ) : (
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
          )}

          {paletteOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              {paletteLabel}
            </span>
          )}
          {sizeOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              Text size
            </span>
          )}
          {shapesOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-20 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              {shapesLabel}
            </span>
          )}
          {stickersOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-20 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              {stickersLabel}
            </span>
          )}

          {!subMenuOpen &&
            wheelItems.map(({ id, label, Icon, angle, accent }) => {
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * ITEM_RADIUS;
              const top = CENTER + Math.sin(rad) * ITEM_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  title={label}
                  onClick={() => handleItemClick(id)}
                  className={cn(
                    "absolute flex min-w-[3.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 py-1.5 text-white transition-all",
                    "hover:scale-105 hover:border-white/30 hover:bg-white/20 active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    accent,
                  )}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="text-[11px] font-bold leading-none tracking-wide text-white">{label}</span>
                </button>
              );
            })}

          {paletteOpen && boardColorOptions.length > 0 && (
            <>
              {boardColorOptions.slice(0, 8).map((pick, index) => {
                const start = 205;
                const step = 130 / Math.max(boardColorOptions.slice(0, 8).length - 1, 1);
                const angle = start + index * step;
                const rad = (angle * Math.PI) / 180;
                const left = CENTER + Math.cos(rad) * SWATCH_RADIUS;
                const top = CENTER + Math.sin(rad) * SWATCH_RADIUS;
                const active =
                  mode === "empty" && activeBoardFill?.toLowerCase() === pick.hex.toLowerCase();

                return (
                  <button
                    key={pick.hex}
                    type="button"
                    title={`${paletteLabel}: ${pick.label}`}
                    aria-label={`Set ${paletteLabel.toLowerCase()} to ${pick.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorPick(pick.hex);
                    }}
                    className={cn(
                      "absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/50 transition-transform",
                      "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      active && "scale-110 ring-2 ring-white",
                    )}
                    style={{ left, top, backgroundColor: pick.hex }}
                  />
                );
              })}
            </>
          )}

          {sizeOpen &&
            TEXT_SIZE_OPTIONS.map(({ id, label }, index) => {
              const start = 205;
              const step = 130 / Math.max(TEXT_SIZE_OPTIONS.length - 1, 1);
              const angle = start + index * step;
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * SWATCH_RADIUS;
              const top = CENTER + Math.sin(rad) * SWATCH_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  title={`Text size ${label}`}
                  aria-label={`Set text size to ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSizePick(id);
                  }}
                  className={cn(
                    "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px] font-bold text-white transition-transform",
                    "hover:scale-110 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  )}
                  style={{ left, top }}
                >
                  {label}
                </button>
              );
            })}

          {shapesOpen &&
            BOARD_MARK_SHAPE_OPTIONS.map(({ id, label, Icon }, index) => {
              const total = BOARD_MARK_SHAPE_OPTIONS.length;
              const perRing = Math.ceil(total / 2);
              const ring = index < perRing ? 0 : 1;
              const ringIndex = ring === 0 ? index : index - perRing;
              const angle = -90 + (360 / perRing) * ringIndex;
              const rad = (angle * Math.PI) / 180;
              const radius = ring === 0 ? SWATCH_RADIUS : SHAPE_INNER_RADIUS;
              const left = CENTER + Math.cos(rad) * radius;
              const top = CENTER + Math.sin(rad) * radius;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={`${shapesLabel}: ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShapePick(id);
                  }}
                  className={cn(
                    "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-transform",
                    "hover:scale-110 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  )}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              );
            })}

          {stickersOpen &&
            BOARD_MARK_STICKER_OPTIONS.map(({ id, label, emoji }, index) => {
              const total = BOARD_MARK_STICKER_OPTIONS.length;
              const perRing = Math.ceil(total / 2);
              const ring = index < perRing ? 0 : 1;
              const ringIndex = ring === 0 ? index : index - perRing;
              const angle = -90 + (360 / perRing) * ringIndex;
              const rad = (angle * Math.PI) / 180;
              const radius = ring === 0 ? SWATCH_RADIUS : STICKER_INNER_RADIUS;
              const left = CENTER + Math.cos(rad) * radius;
              const top = CENTER + Math.sin(rad) * radius;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={`${stickersLabel}: ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStickerPick(id);
                  }}
                  className={cn(
                    "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-base transition-transform",
                    "hover:scale-110 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  )}
                  style={{ left, top }}
                >
                  {emoji}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}
```

## Color strip

```tsx
// src/components/boards/BoardColorStrip.tsx
// NOTE: verbatim copy from the repo at time of export.
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

  const markAsPreset = () => {
    const hex = normalizeBoardColorHex(hexDraft);
    if (!hex) return;
    const next = [hex, ...presets.filter((p) => p !== hex)].slice(0, MAX_COLOR_PRESETS);
    setPresets(next);
    writeColorPresets(userId, next);
  };

  const presetSaved = presets.includes(normalizeBoardColorHex(hexDraft) ?? "");

  return (
    <div className={cn("border-b border-stone-300/50", className)}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Board color</p>

      <input
        type="text"
        value={hexDraft}
        onChange={(e) => setHexDraft(e.target.value)}
        onBlur={() => commitHex(hexDraft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitHex(hexDraft);
        }}
        spellCheck={false}
        className="mb-2 w-full rounded-md border border-stone-300/80 bg-white px-2 py-1.5 font-mono text-[11px] uppercase text-stone-800"
        aria-label="Board color hex code"
      />

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
                onClick={markAsPreset}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-stone-600 transition-colors hover:bg-stone-100",
                  presetSaved && "text-stone-500",
                )}
                aria-label="Mark current color as preset"
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
```

## Editable title

```tsx
// src/components/boards/BoardEditableTitle.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeBoardColorHex } from "@/lib/boards/colors";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TITLE_FONTS = [
  { id: "system", label: "Sans", family: "system-ui, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "display", label: "Block", family: "'Arial Black', 'Helvetica Neue', sans-serif" },
  { id: "script", label: "Script", family: "'Brush Script MT', 'Segoe Script', cursive" },
] as const;

const TITLE_COLOR_PRESETS = ["#171717", "#ffffff", "#e53935", "#1e88e5", "#43a047", "#8e24aa", "#fb8c00"] as const;

type Hsv = { h: number; s: number; v: number };

function titleColorForFill(fillHex: string): string {
  const hex = fillHex.replace("#", "");
  if (hex.length !== 6) return "#171717";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55 ? "#ffffff" : "#171717";
}

function hexToHsv(hex: string): Hsv {
  const normalized = normalizeBoardColorHex(hex) ?? "#171717";
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

type BoardEditableTitleProps = {
  boardId: string;
  title: string;
  headerFill: string;
  titleColor?: string | null;
  titleFont?: string | null;
  onRename: (boardId: string, title: string) => void | Promise<void>;
  onStyleChange: (boardId: string, patch: { title_color?: string | null; title_font?: string | null }) => void | Promise<void>;
  showStyleControls?: boolean;
  className?: string;
  inputClassName?: string;
};

export function BoardEditableTitle({
  boardId,
  title,
  headerFill,
  titleColor,
  titleFont,
  onRename,
  onStyleChange,
  showStyleControls = false,
  className,
  inputClassName,
}: BoardEditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const defaultColor = titleColorForFill(headerFill);
  const savedColor = titleColor ? normalizeBoardColorHex(titleColor) : null;
  const resolvedColor = savedColor ?? defaultColor;

  const [hexDraft, setHexDraft] = useState(resolvedColor);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(resolvedColor));
  const previewColor = normalizeBoardColorHex(hexDraft) ?? resolvedColor;

  const resolvedFont =
    TITLE_FONTS.find((f) => f.id === titleFont)?.family ??
    TITLE_FONTS.find((f) => f.family === titleFont)?.family ??
    TITLE_FONTS[0].family;
  const fontSelectValue =
    TITLE_FONTS.find((f) => f.id === titleFont || f.family === titleFont)?.id ?? "system";

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (draggingRef.current || pickerOpen) return;
    setHexDraft(resolvedColor);
    setHsv(hexToHsv(resolvedColor));
  }, [resolvedColor, pickerOpen]);

  const commitColor = useCallback(
    (raw: string, closePicker = false) => {
      const hex = normalizeBoardColorHex(raw);
      if (!hex) {
        setHexDraft(resolvedColor);
        setHsv(hexToHsv(resolvedColor));
        return;
      }
      setHexDraft(hex);
      setHsv(hexToHsv(hex));
      if (hex !== savedColor) {
        void onStyleChange(boardId, { title_color: hex });
      }
      if (closePicker) setPickerOpen(false);
    },
    [boardId, onStyleChange, resolvedColor, savedColor],
  );

  const applyHsv = useCallback(
    (next: Hsv, commit: boolean) => {
      draggingRef.current = !commit;
      const hex = hsvToHex(next);
      setHsv(next);
      setHexDraft(hex);
      if (commit) {
        draggingRef.current = false;
        commitColor(hex);
      }
    },
    [commitColor],
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

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setDraft(title);
      return;
    }
    void onRename(boardId, trimmed);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(title);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={80}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ color: previewColor, fontFamily: resolvedFont }}
        className={cn(
          "min-w-0 flex-1 rounded border border-neutral-400 bg-white/90 px-1 py-0 text-inherit outline-none ring-1 ring-neutral-900/10 focus:border-neutral-600",
          inputClassName,
        )}
        aria-label="Board name"
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        style={{ color: previewColor, fontFamily: resolvedFont }}
        className={cn(
          "min-w-0 flex-1 truncate text-left decoration-dotted underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none",
          className,
        )}
        title="Click to rename"
      >
        {title}
      </button>
      {showStyleControls ? (
        <>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Title color"
                aria-label="Title color"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded ring-1 ring-black/10"
              >
                <span
                  className="h-4 w-4 rounded-sm ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: previewColor }}
                  aria-hidden
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-56 p-2.5"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Title color</p>
              <input
                type="text"
                value={hexDraft}
                onChange={(e) => setHexDraft(e.target.value)}
                onBlur={() => commitColor(hexDraft)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitColor(hexDraft, true);
                }}
                spellCheck={false}
                className="mb-2 w-full rounded-md border border-stone-300/80 bg-white px-2 py-1.5 font-mono text-[11px] uppercase text-stone-800"
                aria-label="Title color hex"
              />
              <div
                ref={svRef}
                className="relative mb-2 h-24 w-full cursor-crosshair touch-none overflow-hidden rounded-md"
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
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                  style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={Math.round(hsv.h)}
                onChange={(e) => applyHsv({ ...hsv, h: Number(e.target.value) }, true)}
                className="mb-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                aria-label="Hue"
              />
              <div className="grid grid-cols-7 gap-1">
                {TITLE_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    onClick={() => commitColor(hex, true)}
                    className={cn(
                      "aspect-square rounded-sm ring-1 ring-stone-300/70",
                      previewColor.toLowerCase() === hex && "ring-2 ring-stone-900",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <select
            value={fontSelectValue}
            onChange={(e) => void onStyleChange(boardId, { title_font: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-5 max-w-[4.25rem] shrink-0 cursor-pointer rounded border border-black/10 bg-white/80 px-0.5 text-[9px] text-neutral-800"
            aria-label="Title font"
            title="Title font"
          >
            {TITLE_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </div>
  );
}
```

## Guide companion panel

```tsx
// src/components/boards/BoardCompanionPanel.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useCallback, useEffect, useRef, useState } from "react";

import type { RefObject } from "react";

import { Eraser, Loader2, Mic, PenLine, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { BOARD_COLORS } from "@/lib/boards/colors";

import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";

import { supabase } from "@/integrations/supabase/client";

import { cn } from "@/lib/utils";

import { toast } from "sonner";



type ChatTurn = { role: "user" | "assistant"; content: string };

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;



const WELCOME_MESSAGE =

  "Tell me the feeling of this board — I'll plot color, words, and structures with you.";



const WELCOME_TURN: ChatTurn = { role: "assistant", content: WELCOME_MESSAGE };



function chatStorageKey(workspaceId: string) {

  return `board-companion-chat:${workspaceId}`;

}



function loadStoredChat(workspaceId: string): ChatTurn[] | null {

  try {

    const raw = localStorage.getItem(chatStorageKey(workspaceId));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as ChatTurn[];

    if (!Array.isArray(parsed) || !parsed.length) return null;

    return parsed.filter(

      (m) =>

        m &&

        typeof m === "object" &&

        (m.role === "user" || m.role === "assistant") &&

        typeof m.content === "string",

    );

  } catch {

    return null;

  }

}



async function companionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg === "Unauthorized" || msg === "JWT expired") {
      return "I could not reach the guide right now. Please refresh or sign in again.";
    }
  }

  if (error && typeof error === "object" && "context" in error) {

    const ctx = (error as { context?: Response }).context;

    const status = ctx?.status;

    try {

      const body = (await ctx?.json?.()) as { error?: string; reply?: string } | undefined;

      if (body?.error === "Plotting Pro subscription required") {

        return "Guide needs an active Palette Plotting Pro plan.";

      }

      if (typeof body?.error === "string" && body.error.trim()) return body.error.trim();

    } catch {

      /* ignore parse errors */

    }

    if (status === 401 || status === 403) {
      return "I could not reach the guide right now. Please refresh or sign in again.";
    }

    if (status === 404) return "Couldn't find this board.";

    if (status === 500 || status === 502 || status === 503 || status === 504) {

      return "Guide isn't reachable right now. Try again in a moment.";

    }

  }

  return "Companion's quiet for a moment — try again shortly.";

}

async function isCompanionAuthError(error: unknown): Promise<boolean> {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg === "Unauthorized" || msg === "JWT expired") return true;
  }
  if (error && typeof error === "object" && "context" in error) {
    const status = (error as { context?: Response }).context?.status;
    if (status === 401 || status === 403) return true;
  }
  return false;
}



const VALID_COLOR_KEYS = new Set(Object.keys(BOARD_COLORS));

const VALID_DIAGRAMS = new Set<BoardDiagramType>([

  "eisenhower",

  "checklist",

  "zones",

  "timeline",

  "kanban",

  "gantt",

  "okrs",

  "five_s",

  "divider",

]);



const FALLBACK_ASK_REPLY =
  "I can help with that. What would you like me to add first: a Statement, a Sticky note, a Checklist, or a Priority grid?";

const CONFIRM_RE = /^(yes|yeah|yep|y|sure|ok|okay|do it|apply it|go ahead|please do|sounds good)\.?$/i;
const CANCEL_RE = /^(no|nope|cancel|don't|dont|stop)\.?$/i;

function replyClaimsBoardChanges(text: string): boolean {
  return /\b(I('ve| have)?\s+(set|added|placed|plotted|changed|created)|I added|I've set|I placed|I plotted)\b/i.test(
    text,
  );
}

function finalizeAssistantReply(
  reply: string | undefined,
  replyWithoutAction: string | undefined,
  appliedCount: number,
): string {
  if (appliedCount > 0) {
    const raw = (reply ?? "").trim();
    return raw || `Done — I added ${appliedCount} ${appliedCount === 1 ? "piece" : "pieces"} to the board.`;
  }
  const neutral = (replyWithoutAction ?? reply ?? "").trim();
  if (neutral && !replyClaimsBoardChanges(neutral)) return neutral;
  return FALLBACK_ASK_REPLY;
}

type GuideAction = Record<string, unknown> & { type: string };

function isValidGuideAction(action: unknown): action is GuideAction {
  if (!action || typeof action !== "object") return false;
  const a = action as Record<string, unknown>;
  switch (a.type) {
    case "set_color":
      return typeof a.color_key === "string" && VALID_COLOR_KEYS.has(a.color_key);
    case "add_text":
      return typeof a.text === "string" && a.text.trim().length > 0;
    case "add_sticky":
      return typeof a.text === "string" && a.text.trim().length > 0;
    case "add_diagram":
      return typeof a.diagram === "string" && VALID_DIAGRAMS.has(a.diagram as BoardDiagramType);
    default:
      return false;
  }
}

function filterValidGuideActions(actions: unknown[]): GuideAction[] {
  return actions.filter(isValidGuideAction);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}



type BoardCompanionPanelProps = {

  workspaceId: string;

  activeBoardId: string;

  editorRef: RefObject<BoardCanvasHandle | null>;

  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;

  compact?: boolean;

};



export function BoardCompanionPanel({

  workspaceId,

  activeBoardId,

  editorRef,

  onBoardColorChange,

  compact = false,

}: BoardCompanionPanelProps) {

  const [messages, setMessages] = useState<ChatTurn[]>([WELCOME_TURN]);

  const [draft, setDraft] = useState("");

  const [sending, setSending] = useState(false);

  const [guideError, setGuideError] = useState<string | null>(null);

  const [lastApplied, setLastApplied] = useState(0);

  const [pendingGuideActions, setPendingGuideActions] = useState<GuideAction[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechRecognitionInstance | null>(null);
  const draftAtListenStartRef = useRef("");
  const sessionTranscriptRef = useRef("");
  const speechSupportedRef = useRef(
    typeof window !== "undefined" &&
      !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition),
  );

  const [listening, setListening] = useState(false);
  const [speechSupported] = useState(() => speechSupportedRef.current);

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  useEffect(() => {
    scrollChatToBottom();
  }, [messages, sending, guideError, lastApplied, pendingGuideActions.length, scrollChatToBottom]);

  useEffect(() => {
    return () => {
      speechRef.current?.abort();
      speechRef.current = null;
    };
  }, []);

  const commitSessionTranscript = useCallback(() => {
    const base = draftAtListenStartRef.current.trim();
    const spoken = sessionTranscriptRef.current.trim();
    if (!spoken) return;
    setDraft(base ? `${base} ${spoken}` : spoken);
    draftAtListenStartRef.current = base ? `${base} ${spoken}` : spoken;
  }, []);

  const stopListening = useCallback(() => {
    if (!speechRef.current) {
      setListening(false);
      return;
    }
    speechRef.current.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (!speechSupported) {
      toast.message("Voice input isn't supported in this browser.");
      return;
    }
    if (listening) {
      stopListening();
      return;
    }
    if (sending) return;

    const Ctor =
      window.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    if (!Ctor) {
      toast.message("Voice input isn't supported in this browser.");
      return;
    }

    speechRef.current?.abort();
    const recognition = new Ctor();
    speechRef.current = recognition;
    draftAtListenStartRef.current = draft;
    sessionTranscriptRef.current = "";

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      sessionTranscriptRef.current = transcript;
      const base = draftAtListenStartRef.current.trim();
      const spoken = transcript.trim();
      if (!spoken) return;
      setDraft(base ? `${base} ${spoken}` : spoken);
    };

    recognition.onerror = () => {
      commitSessionTranscript();
      setListening(false);
      speechRef.current = null;
    };

    recognition.onend = () => {
      commitSessionTranscript();
      setListening(false);
      speechRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      toast.message("Could not start microphone.");
      setListening(false);
    }
  }, [commitSessionTranscript, draft, listening, sending, speechSupported, stopListening]);

  useEffect(() => {

    if (!workspaceId) {

      setMessages([WELCOME_TURN]);

      return;

    }

    setMessages(loadStoredChat(workspaceId) ?? [WELCOME_TURN]);

  }, [workspaceId]);



  useEffect(() => {

    if (!workspaceId) return;

    localStorage.setItem(chatStorageKey(workspaceId), JSON.stringify(messages));

  }, [messages, workspaceId]);



  const applyActions = useCallback(
    async (actions: unknown[]): Promise<number> => {
      if (!activeBoardId) {
        console.error("Guide applyActions: missing activeBoardId");
        return 0;
      }

      const editor = editorRef.current;
      let applied = 0;

      for (const raw of filterValidGuideActions(actions)) {
        const action = raw;
        const type = action.type;

        try {
          if (type === "set_color" && typeof action.color_key === "string") {
            await onBoardColorChange(activeBoardId, action.color_key);
            applied += 1;
            continue;
          }

          if (!editor) {
            console.error("Guide applyActions: editor ref missing for", type);
            continue;
          }

          if (type === "kanban_seed" && Array.isArray(action.columns)) {
            const titles = (action.columns as { title?: string }[])
              .map((c) => (typeof c.title === "string" ? c.title : ""))
              .filter(Boolean);
            editor.addDiagramOverlay("kanban", 0.08, 0.42, 0.84, 0.5, titles.length ? titles : undefined);
            applied += 1;
            continue;
          }

          if (type === "gantt_seed" && Array.isArray(action.tasks)) {
            const names = (action.tasks as { name?: string }[])
              .map((t) => (typeof t.name === "string" ? t.name : ""))
              .filter(Boolean);
            editor.addDiagramOverlay("gantt", 0.1, 0.45, 0.8, 0.42, names.length ? names : undefined);
            applied += 1;
            continue;
          }

          if (type === "add_text" && typeof action.text === "string") {
            editor.addTextNormalized(
              action.text,
              clamp01(typeof action.x === "number" ? action.x : 0.5),
              clamp01(typeof action.y === "number" ? action.y : 0.12),
              typeof action.font_size === "number" ? action.font_size : 40,
              typeof action.color === "string" ? action.color : "#000000",
            );
            applied += 1;
            continue;
          }

          if (type === "add_sticky" && typeof action.text === "string") {
            editor.addStickyNoteAt(
              action.text,
              clamp01(typeof action.x === "number" ? action.x : 0.12),
              clamp01(typeof action.y === "number" ? action.y : 0.35),
              typeof action.fill === "string" ? action.fill : "#FFF9C4",
            );
            applied += 1;
            continue;
          }

          if (type === "add_diagram" && typeof action.diagram === "string") {
            const diagram = action.diagram as BoardDiagramType;
            const items = Array.isArray(action.items)
              ? action.items.filter((i): i is string => typeof i === "string")
              : [];
            editor.addDiagramOverlay(
              diagram,
              clamp01(typeof action.x === "number" ? action.x : 0.52),
              clamp01(typeof action.y === "number" ? action.y : 0.52),
              clamp01(typeof action.w === "number" ? action.w : 0.4),
              clamp01(typeof action.h === "number" ? action.h : 0.34),
              items,
              typeof action.accent === "string" ? action.accent : "#2563EB",
            );
            applied += 1;
          }
        } catch (error) {
          console.error("Failed to apply guide action", action, error);
        }
      }

      return applied;
    },
    [activeBoardId, editorRef, onBoardColorChange],
  );



  const clearChat = useCallback(() => {

    setMessages([WELCOME_TURN]);

    setLastApplied(0);
    setPendingGuideActions([]);
    setGuideError(null);

    if (workspaceId) {

      localStorage.setItem(chatStorageKey(workspaceId), JSON.stringify([WELCOME_TURN]));

    }

    toast.message("Chat cleared");

  }, [workspaceId]);



  const applyPendingGuideActions = useCallback(async () => {
    if (pendingGuideActions.length === 0 || sending) return;
    setSending(true);
    setGuideError(null);
    setLastApplied(0);
    try {
      const appliedCount = await applyActions(pendingGuideActions);
      setPendingGuideActions([]);
      setLastApplied(appliedCount);
      if (appliedCount > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Done — I added ${appliedCount} ${appliedCount === 1 ? "piece" : "pieces"} to the board.`,
          },
        ]);
      } else {
        setGuideError("I couldn't apply those changes to the board. Try again.");
      }
    } finally {
      setSending(false);
    }
  }, [applyActions, pendingGuideActions, sending]);

  const sendMessage = useCallback(async () => {

    const text = draft.trim();

    if (!text || sending || !activeBoardId) return;

    if (listening) stopListening();

    setDraft("");

    setLastApplied(0);
    setGuideError(null);

    const nextMessages: ChatTurn[] = [...messages, { role: "user", content: text }];

    setMessages(nextMessages);

    if (CANCEL_RE.test(text) && pendingGuideActions.length > 0) {
      setPendingGuideActions([]);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "No problem — tell me when you want to add something." },
      ]);
      return;
    }

    if (CONFIRM_RE.test(text) && pendingGuideActions.length > 0) {
      await applyPendingGuideActions();
      return;
    }

    setSending(true);

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      const session =
        refreshData.session ?? (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        setGuideError("I could not reach the guide right now. Please refresh or sign in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("board-design-chat", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          board_id: activeBoardId,
          workspace_id: workspaceId,
          message: text,
          history: nextMessages.filter((m) => m.role === "user" || m.role === "assistant").slice(-8),
        },
      });

      if (error) throw error;

      const payload = data as {
        reply?: string;
        reply_without_action?: string;
        actions?: unknown[];
        proposed_actions?: unknown[];
        error?: string;
      };

      if (payload?.error && !payload.reply) {
        throw new Error(payload.error);
      }

      const actions = Array.isArray(payload.actions) ? payload.actions : [];
      const proposed = Array.isArray(payload.proposed_actions) ? payload.proposed_actions : [];
      const validProposed = filterValidGuideActions(proposed);

      let appliedCount = 0;
      if (actions.length > 0) {
        const validActions = filterValidGuideActions(actions);
        if (validActions.length > 0) {
          appliedCount = await applyActions(validActions);
        }
        if (actions.length > 0 && appliedCount === 0) {
          console.error("Guide returned actions but none applied", actions);
          setGuideError("I couldn't apply those changes to the board. Try again.");
        }
      }

      if (validProposed.length > 0) {
        setPendingGuideActions(validProposed);
      } else {
        setPendingGuideActions([]);
      }

      setLastApplied(appliedCount);

      const finalReply = finalizeAssistantReply(
        payload.reply,
        payload.reply_without_action,
        appliedCount,
      );

      setMessages((prev) => [...prev, { role: "assistant", content: finalReply }]);

    } catch (err) {

      if (await isCompanionAuthError(err)) {
        console.warn("Guide auth error", err);
        setGuideError("I could not reach the guide right now. Please refresh or sign in again.");
      } else {
        const message = await companionErrorMessage(err);
        setMessages((prev) => [...prev, { role: "assistant", content: message }]);
      }

    } finally {

      setSending(false);

    }

  }, [activeBoardId, applyActions, applyPendingGuideActions, draft, listening, messages, pendingGuideActions, sending, stopListening, workspaceId]);



  return (

    <div className={cn("flex flex-col", compact ? "min-h-[280px]" : "min-h-0 flex-1")}>

      <div className="flex shrink-0 border-b border-stone-300/60 px-3 py-2">

        <Button

          type="button"

          variant="ghost"

          size="sm"

          className="h-8 w-full justify-start gap-2 px-2 text-xs font-medium text-stone-600 hover:text-red-700"

          onClick={clearChat}

          disabled={messages.length <= 1 && messages[0]?.content === WELCOME_MESSAGE}

        >

          <Eraser className="h-3.5 w-3.5" />

          Clear chat

        </Button>

      </div>



      <div

        ref={scrollRef}

        className={cn("flex flex-col gap-2 overflow-y-auto p-3", compact ? "max-h-[36vh]" : "min-h-0 flex-1")}

      >

        {messages.map((m, i) => (

          <div

            key={`${m.role}-${i}`}

            className={cn(

              "rounded-lg px-3 py-2 text-xs leading-relaxed",

              m.role === "user"

                ? "ml-3 bg-stone-900 text-stone-50"

                : "mr-1 border border-stone-300/80 bg-[#faf8f5] text-stone-800",

            )}

          >

            {m.content}

          </div>

        ))}

        {lastApplied > 0 ? (

          <p className="flex items-center gap-1.5 text-[10px] font-medium text-stone-600">

            <PenLine className="h-3 w-3" />

            Done — added {lastApplied} {lastApplied === 1 ? "piece" : "pieces"} to the board

          </p>

        ) : null}

        {pendingGuideActions.length > 0 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-stone-300 bg-[#faf8f5] text-[10px]"
              disabled={sending}
              onClick={() => void applyPendingGuideActions()}
            >
              Apply suggestion
            </Button>
            <span className="text-[10px] text-stone-500">or reply yes</span>
          </div>
        ) : null}

        {sending ? (

          <p className="flex items-center gap-2 text-xs text-stone-500">

            <Loader2 className="h-3.5 w-3.5 animate-spin" />

            Plotting…

          </p>

        ) : null}

        {guideError ? (
          <p className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {guideError}
          </p>
        ) : null}

        <div ref={bottomRef} aria-hidden className="h-px shrink-0" />

      </div>

      <form

        className="flex shrink-0 gap-2 border-t border-stone-300/60 bg-[#f3f0eb] p-2"

        onSubmit={(e) => {

          e.preventDefault();

          void sendMessage();

        }}

      >

        <Input

          value={draft}

          onChange={(e) => setDraft(e.target.value)}

          placeholder="The vibe, the goal, the feeling…"

          className="h-9 min-w-0 flex-1 border-stone-300 bg-[#faf8f5] text-xs"

          disabled={sending}

        />

        {speechSupported ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "h-9 w-9 shrink-0 border-stone-300 bg-[#faf8f5]",
              listening && "border-red-400 bg-red-50 text-red-600",
            )}
            disabled={sending}
            aria-label={listening ? "Stop dictation" : "Dictate message"}
            onClick={toggleListening}
          >
            <Mic className={cn("h-4 w-4", listening && "animate-pulse")} />
          </Button>
        ) : null}

        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-stone-900" disabled={sending || !draft.trim()}>

          <Send className="h-4 w-4" />

        </Button>

      </form>

    </div>

  );

}
```

## Image picker

```tsx
// src/components/boards/BoardImagePicker.tsx
// NOTE: verbatim copy from the repo at time of export.
import { useCallback, useEffect, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BOARD_IMAGE_THEMES,
  filterLibraryByTheme,
  getCachedBoardImageLibrary,
  loadBoardImageLibrary,
  type BoardImageTheme,
} from "@/lib/boards/imageLibrary";
import { listUserUploads, uploadBoardImage } from "@/lib/boards/api";
import type { BoardImageAsset } from "@/lib/boards/types";

type BoardImagePickerProps = {
  userId: string;
  onPickImage?: (url: string) => void;
  embedded?: boolean;
  /** Workspace Image Library: user uploads only (no stock collection). */
  uploadsOnly?: boolean;
};

type Tab = "library" | "uploads";

const uploadsCache = new Map<string, { path: string; signedUrl: string }[]>();

export function BoardImagePicker({
  userId,
  onPickImage,
  embedded,
  uploadsOnly = false,
}: BoardImagePickerProps) {
  const [tab, setTab] = useState<Tab>(uploadsOnly ? "uploads" : "library");
  const [theme, setTheme] = useState<BoardImageTheme | "all">("all");
  const [library, setLibrary] = useState<BoardImageAsset[]>(() =>
    uploadsOnly ? [] : (getCachedBoardImageLibrary() ?? []),
  );
  const [uploads, setUploads] = useState(() => uploadsCache.get(userId) ?? []);
  const [loading, setLoading] = useState(() => {
    const hasUploads = uploadsCache.has(userId);
    const hasLibrary = uploadsOnly || getCachedBoardImageLibrary() !== null;
    return !hasUploads && !hasLibrary;
  });
  const [uploading, setUploading] = useState(false);

  const refreshUploads = useCallback(async () => {
    const list = await listUserUploads(userId);
    uploadsCache.set(userId, list);
    setUploads(list);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    const hadCache = uploadsCache.has(userId) || (!uploadsOnly && getCachedBoardImageLibrary() !== null);
    (async () => {
      if (!hadCache) setLoading(true);
      try {
        if (!uploadsOnly) {
          const imgs = await loadBoardImageLibrary();
          if (!cancelled) setLibrary(imgs);
        }
        await refreshUploads();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUploads, uploadsOnly, userId]);

  const filtered = theme === "all" ? library : filterLibraryByTheme(library, theme);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBoardImage(userId, file);
      await refreshUploads();
      onPickImage?.(url);
      setTab("uploads");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={cn("flex h-full flex-col bg-transparent", !embedded && "border-r border-neutral-200 bg-white")}>
      {!uploadsOnly && (
        <div className="flex items-center justify-center gap-4 border-b border-neutral-200 px-3 py-2">
          {(["library", "uploads"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cn(
                "px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wide",
                "border-b border-transparent",
                tab === t ? "border-neutral-500 text-neutral-900" : "text-neutral-500 hover:text-neutral-800",
              )}
              onClick={() => setTab(t)}
            >
              {t === "library" ? "Our Collection" : "Your Library"}
            </button>
          ))}
        </div>
      )}

      {tab === "library" && !uploadsOnly && (
        <div className="border-b border-neutral-100 p-2">
          <select
            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs"
            value={theme}
            onChange={(e) => setTheme(e.target.value as BoardImageTheme | "all")}
          >
            <option value="all">All themes</option>
            {BOARD_IMAGE_THEMES.map((th) => (
              <option key={th} value={th}>
                {th}
              </option>
            ))}
          </select>
        </div>
      )}

      {(tab === "uploads" || uploadsOnly) && (
        <div className="flex gap-2 border-b border-neutral-100 p-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 flex-1 gap-1.5 px-2 text-[11px] font-medium"
            asChild
            disabled={uploading}
          >
            <label className={cn("cursor-pointer", uploading && "pointer-events-none opacity-60")}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <Upload className="h-3.5 w-3.5 shrink-0" />}
              Upload Photo
              <input type="file" accept="image/*" className="sr-only" onChange={onFileChange} disabled={uploading} />
            </label>
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : tab === "library" && !uploadsOnly ? (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((img) => (
              <button
                key={img.id}
                type="button"
                className="group overflow-hidden rounded-md border border-neutral-200 hover:ring-2 hover:ring-neutral-900/20"
                onClick={() => onPickImage?.(img.url)}
              >
                <img src={img.url} alt={img.description} className="aspect-square w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        ) : uploads.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-neutral-500">Nothing in Your Library yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {uploads.map((u) => (
              <button
                key={u.path}
                type="button"
                className="overflow-hidden rounded-md border border-neutral-200 hover:ring-2 hover:ring-neutral-900/20"
                onClick={() => onPickImage?.(u.signedUrl)}
              >
                <img src={u.signedUrl} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Print / download dialog

```tsx
// src/components/boards/BoardPrintDialog.tsx
// NOTE: verbatim copy from the repo at time of export.
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
  downloadBoardPrint,
  downloadBoardsPrintPdf,
  type BoardPrintPreset,
} from "@/lib/boards/renderBoard";
import { downloadPhoneWallpaper } from "@/lib/boards/phoneWallpaper";
import type { Board } from "@/lib/boards/types";
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
    description: "Portrait PNG for your phone — current board only",
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

  const selectedBoards = useMemo(
    () => boards.filter((b) => selectedBoardIds.includes(b.id)),
    [boards, selectedBoardIds],
  );

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];
  const downloadAsPdf = !isPhoneWallpaper && selectedBoards.length > 1;
  const canDownload = isPhoneWallpaper ? Boolean(activeBoard) : selectedBoards.length > 0;

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
      if (isPhoneWallpaper && activeBoard) {
        await downloadPhoneWallpaper(
          getLayoutJson(activeBoard.id),
          activeBoard.color_key,
          activeBoard.title,
        );
        toast.success("Phone wallpaper downloaded");
      } else if (printPreset) {
        const sources = selectedBoards.map((board) => ({
          layoutJson: getLayoutJson(board.id),
          colorKey: board.color_key,
          title: board.title,
        }));

        if (sources.length === 1) {
          await downloadBoardPrint(
            sources[0].layoutJson,
            sources[0].colorKey,
            printPreset,
            sources[0].title,
          );
          toast.success(`Downloaded ${sources[0].title} (${printPreset.label})`);
        } else {
          await downloadBoardsPrintPdf(sources, printPreset);
          toast.success(`Downloaded ${sources.length} boards as PDF (${printPreset.label})`);
        }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Download</DialogTitle>
          <DialogDescription>
            {isPhoneWallpaper
              ? "Choose a format and download the current board as a PNG."
              : "Choose a print format and select boards. One board downloads as PNG; multiple boards download as a multi-page PDF."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Format</Label>
            <select
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={optionId}
              onChange={(e) => setOptionId(e.target.value as DownloadOptionId)}
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

          {!isPhoneWallpaper && boards.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Vision</Label>
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
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-neutral-200 p-2">
                {boards.map((board) => {
                  const checked = selectedBoardIds.includes(board.id);
                  return (
                    <label
                      key={board.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-neutral-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleBoard(board.id, value === true)}
                      />
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
                {selectedBoards.length === 0
                  ? "Select at least one board."
                  : selectedBoards.length === 1
                    ? "One board — downloads as PNG."
                    : `${selectedBoards.length} boards — one page each in a PDF.`}
              </p>
            </div>
          )}

          {isPhoneWallpaper && activeBoard && (
            <p className="text-[11px] leading-snug text-neutral-500">
              Downloading <span className="font-medium text-neutral-700">{activeBoard.title}</span> only.
            </p>
          )}
        </div>

        <Button className="gap-2" disabled={busy || !canDownload} onClick={() => void handleDownload()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isPhoneWallpaper ? "Download PNG" : downloadAsPdf ? "Download PDF" : "Download PNG"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

## Board editor styles

```css
// src/styles/board-editor.css
// NOTE: verbatim copy from the repo at time of export.
.board-editor-main {
  min-height: 0;
}

.board-artboard-host canvas {
  display: block;
}

.board-desktop-grid {
  min-height: 0;
}

.board-grid-cell {
  min-height: 0;
}

.board-mobile-carousel {
  min-height: 0;
}

@media (max-width: 767px) {
  .board-mobile-carousel .board-artboard-host {
    min-height: 0;
    height: 100%;
  }
}

@media (min-width: 768px) {
  .board-grid-cell .board-artboard-host {
    min-height: 0;
    height: 100%;
  }

  .board-row-scroll {
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .board-marks-quick-selector {
    animation: boardMarksWheelIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes boardMarksWheelIn {
    from {
      opacity: 0;
      transform: scale(0.82);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}
```

## Guide chat edge function

```ts
// supabase/functions/board-design-chat/index.ts
// NOTE: verbatim copy from the repo at time of export.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";

import {
  BOARDS_AI_SAFETY_POLICY,
  screenBoardsUserInput,
} from "../_shared/boardsAiGuardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatTurn = { role: "user" | "assistant"; content: string };

const COLOR_PALETTE = `Palette Plotting board colors (pick color_key for board background vibe):
- rose_gold (#F5E1E3) — warmth, romance, self-love, gentle ambition
- light_pink (#FDE8F0) — soft, nurturing, feminine calm
- neon_pink (#FFE0F0) — bold energy, confidence, playful drive
- sky_blue (#E3F4FC) — clarity, calm focus, open sky thinking
- red (#FCE4E6) — urgency, passion, decisive action
- yellow (#FFF8DC) — optimism, creativity, morning energy
- green (#E0F5EA) — growth, health, steady progress
- light_green (#EDFCEB) — fresh starts, nature, ease
- blue (#E0EBFF) — professionalism, trust, deep work
- orange (#FFE8D6) — enthusiasm, social warmth, momentum
- clear (#FAFAFA) — minimal, neutral canvas
- white_opaque (#FFFFFF) — clean plan board, structure
- black_opaque (#F5F5F5) — contrast, sophistication, editorial`;

const DESIGN_CAPABILITIES = `You are the board Guide inside a visual planning board for Palette Plotting.

Your job is to help the user decide what to put on the board, then apply changes only when the user gives a direct command or confirms a proposal.

You MUST respond with valid JSON only:
{
  "reply": "Short practical message (under 60 words)",
  "reply_without_action": "Optional — use when actions is empty and reply should not imply anything was added",
  "actions": [ ...0-8 actions to apply immediately... ],
  "proposed_actions": [ ...0-8 actions to suggest but NOT apply until user confirms... ]
}

Action types (normalized coords 0-1 on a 1080×1350 artboard):

1. set_color — change board background
   { "type": "set_color", "color_key": "orange" }
   color_key must be one of: rose_gold, light_pink, neon_pink, sky_blue, red, yellow, green, light_green, blue, orange, clear, white_opaque, black_opaque
   For coral/warm requests use color_key "orange".

2. add_text — Statement (headline or label)
   { "type": "add_text", "text": "Embrace Joy", "x": 0.12, "y": 0.14, "font_size": 40, "color": "#171717" }

3. add_sticky — Sticky note
   { "type": "add_sticky", "text": "Daily Gratitude", "x": 0.14, "y": 0.32, "fill": "#FFF4A8" }

4. add_diagram — Checklist or Priority grid (internal type only; never say "diagram" in replies)
   { "type": "add_diagram", "diagram": "eisenhower", "x": 0.52, "y": 0.2, "w": 0.42, "h": 0.44 }
   diagram: "eisenhower" = Priority grid | "checklist" = Checklist

5. kanban_seed — ONLY when board layout_mode is kanban
6. gantt_seed — ONLY when board layout_mode is gantt

User-facing names in replies:
- Statement (not "text")
- Sticky note
- Checklist
- Priority grid (never "Eisenhower diagram")

Behavior rules:
- Do NOT make board changes for vague or emotional requests. Ask one useful question. Return "actions": [].
- Vague examples: "I need help", "help me", "make this better", "make it happier", "make this feel productive", "organize this for me", "what should I do with this board".
- For vague prompts, good reply: "Of course. What do you want this board to help with first — planning tasks, shaping the vibe, or mapping purchases?"
- Direct commands apply immediately via "actions": e.g. "make this board coral", "add a statement that says Embrace Joy", "add a priority grid".
- If you want multiple changes from a non-specific prompt, ask first. Put the bundle in "proposed_actions", NOT "actions". Reply: "Want me to apply that?"
- Never say you added, placed, plotted, changed, or created something unless you return matching "actions" for a direct command.
- Keep replies short and practical. No design-therapy language. No "fosters clarity", "happiness goals", or similar filler.
- If the user only wants to chat, return empty actions and proposed_actions.
- Prefer one change at a time unless the user asked for several explicitly.

${COLOR_PALETTE}`;

const SYSTEM = `${DESIGN_CAPABILITIES}

${BOARDS_AI_SAFETY_POLICY}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createServiceRoleClient();
    const hasPro = await userHasActivePlottingPro(admin, userData.user.id);
    if (!hasPro) {
      return plottingProRequiredResponse(corsHeaders);
    }

    const body = await req.json();
    const board_id = body.board_id as string | undefined;
    const message = (body.message as string | undefined)?.trim();
    const history = (Array.isArray(body.history) ? body.history : []) as ChatTurn[];

    if (!board_id || !message) {
      return new Response(JSON.stringify({ error: "board_id and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputScreen = screenBoardsUserInput(message);
    if (!inputScreen.ok) {
      return new Response(JSON.stringify({ reply: inputScreen.reply, actions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: board, error: boardErr } = await supabase
      .from("boards")
      .select("id, title, role, layout_mode, layout_json, color_key, workspace_id")
      .eq("id", board_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (boardErr || !board) {
      return new Response(JSON.stringify({ error: "Board not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: siblings } = await supabase
      .from("boards")
      .select("title, role, layout_mode, color_key")
      .eq("workspace_id", board.workspace_id)
      .eq("user_id", userData.user.id)
      .order("sort_order", { ascending: true });

    const objects = (board.layout_json as { objects?: { type?: string; text?: string }[] })?.objects ?? [];
    const textSnippets = objects
      .map((o) => (typeof o.text === "string" ? o.text : ""))
      .filter((t) => t.trim().length > 1)
      .slice(0, 20);

    const structured = board.layout_json as { editor?: string; columns?: unknown[]; tasks?: unknown[] };
    const layoutHint =
      structured.editor === "kanban"
        ? `Kanban: ${JSON.stringify(structured.columns ?? []).slice(0, 600)}`
        : structured.editor === "gantt"
          ? `Gantt: ${JSON.stringify(structured.tasks ?? []).slice(0, 600)}`
          : textSnippets.length
            ? `Canvas text: ${textSnippets.join(" | ")}`
            : "Canvas is mostly empty.";

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          reply: "What would you like to add or change on this board?",
          actions: [],
          proposed_actions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const context = `Active board: "${board.title}" (${board.role}, layout_mode: ${board.layout_mode ?? "vision"}, color_key: ${board.color_key}).
Workspace boards: ${(siblings ?? []).map((b) => `${b.title} [${b.color_key}/${b.layout_mode}]`).join(", ") || "none"}.
${layoutHint}`;

    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Board context:\n${context}` },
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      throw new Error("AI request failed");
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: {
      reply?: string;
      reply_without_action?: string;
      actions?: unknown[];
      proposed_actions?: unknown[];
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw, actions: [], proposed_actions: [] };
    }

    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "What would you like to add or change on this board?";
    const reply_without_action =
      typeof parsed.reply_without_action === "string" && parsed.reply_without_action.trim()
        ? parsed.reply_without_action.trim()
        : undefined;
    const actions = Array.isArray(parsed.actions) ? parsed.actions.slice(0, 14) : [];
    const proposed_actions = Array.isArray(parsed.proposed_actions)
      ? parsed.proposed_actions.slice(0, 14)
      : [];

    return new Response(JSON.stringify({ reply, reply_without_action, actions, proposed_actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "chat failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## Design spec

### Concept

Multi-board vision plotting workspace. Three focus boards + **The Plan** (standard four-board plot). Fabric.js canvas per board with marks (text, sticky notes, shapes, stickers, freehand), structures (checklist, zones, kanban decals, etc.), image clippings, and Guide chat companion.

### Desktop layout

```txt
[HEADER: Vision | Add board | Duplicate | Remove | Download | -> Action]
[TOOLBAR: Text | Note | Undo | Redo | Reset board | Delete | zoom presets]
[LEFT DOCK: Guide | Images | Structures | Marks] [HORIZONTAL BOARD GRID scroll]
```

### Mobile layout

Carousel of boards + bottom **Plot kit tray** (Guide, Images, Structures, Marks sheets).

### Artboard

- Native editor size: **1080x1350** (4:5) - see `ARTBOARD_WIDTH` / `ARTBOARD_HEIGHT` in `BoardCanvasEditor`.
- Board fill from `color_key` via `boardFillForKey()`.
- Layout persisted as Fabric JSON in `boards.layout_json`.

### Files

| File | Role |
|------|------|
| `src/pages/features/Boards.tsx` | Page shell, workspace load, board CRUD |
| `src/components/boards/BoardCanvasEditor.tsx` | Fabric canvas, marks, structures |
| `src/components/boards/BoardDesktopGrid.tsx` | Horizontal scroll grid (desktop) |
| `src/components/boards/BoardPlottingWorkbench.tsx` | Left dock (desktop) |
| `src/components/boards/BoardPlotKitTray.tsx` | Bottom dock (mobile) |
| `src/components/boards/BoardCompanionPanel.tsx` | Guide chat |
| `src/lib/boards/api.ts` | Supabase workspace/board CRUD |
| `supabase/functions/board-design-chat/index.ts` | Guide AI companion |

Route: `/dashboard/boards`

Deploy Guide function: `supabase functions deploy board-design-chat --project-ref essjyrhhaiywotvgjkcg`

Test: `support@test.com` / `Test!123`

---

## Do not touch

Action accountability map (`/dashboard/boards/accountability`), onboarding flows, site marketing pages.
