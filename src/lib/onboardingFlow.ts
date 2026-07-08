/** Active onboarding route registry. */

export const ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/name",
  "/onboarding/setup/starting-system",
  "/onboarding/setup/focus-categories",
  "/onboarding/setup/home-focus",
  "/onboarding/setup/office-planning-system",
  "/onboarding/setup/moodboard-focus",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/attribution",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/email",
] as const;

/** Logical setup steps for progress bar (branch screens share one step). */

export const SETUP_PROGRESS_STEP_GROUPS = [
  ["name"],
  ["starting-system"],
  ["focus-categories", "home-focus", "office-planning-system", "moodboard-focus"],
  ["begin-journey"],
  ["attribution"],
  ["plot-loading"],
  ["plot-synthesis"],
  ["email"],
] as const;

export function getSetupProgressPercent(pathname: string): number | null {
  const normalized = pathname.replace(/\/$/, "");

  const setupPrefix = normalized.includes("/onboarding/setup/")
    ? "/onboarding/setup/"
    : null;

  if (!setupPrefix) return null;

  const step = normalized.slice(setupPrefix.length);
  const index = SETUP_PROGRESS_STEP_GROUPS.findIndex((group) =>
    (group as readonly string[]).includes(step),
  );

  if (index < 0) return null;

  return ((index + 1) / SETUP_PROGRESS_STEP_GROUPS.length) * 100;
}

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Your Name",
  "Starting system",
  "Focus boards",
  "Begin journey",
  "Found us",
  "Building room",
  "Your plot",
  "Account",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_ROUTES.length;
