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
  artboard_width?: number;
  artboard_height?: number;
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
