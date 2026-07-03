import { dashboardFeatures } from "@/lib/featuresData";

/**
 * Practitioner-facing tools: distinct experiences with their own routes.
 * Matches how we list tools in support reporting (dashboard tiles + linked destinations).
 * Excludes settings, billing, and onboarding.
 */
export const ADDITIONAL_PRACTITIONER_TOOLS = [
  {
    id: "affirmation-visualizer",
    name: "Affirmation Visualizer",
    path: "/dashboard/affirmation-viewer",
  },
  { id: "guide-chat", name: "Talk to Guide", path: "/dashboard/your-journey/chat" },
  { id: "music-composer", name: "Music Composer", path: "/dashboard/music-composer" },
  { id: "tap-in", name: "Piano Tapping", path: "/dashboard/tap-in" },
  { id: "activity-tracking", name: "Activity tracking", path: "/dashboard/activity-tracking" },
  { id: "journal", name: "Manifestation Journal", path: "/dashboard/chrono" },
] as const;

/** All named practitioner tools (6 dashboard entry points + 6 linked tool areas). */
export const PRACTITIONER_TOOLS = [
  ...dashboardFeatures.map((f) => ({
    id: f.path,
    name: f.title,
    path: f.path,
  })),
  ...ADDITIONAL_PRACTITIONER_TOOLS,
] as const;

export const PRACTITIONER_TOOL_COUNT = PRACTITIONER_TOOLS.length;
