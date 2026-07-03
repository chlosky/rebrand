/** Native + default path list (full suite funnel). */
export const ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/name",
  "/onboarding/setup/primary-intent",
  "/onboarding/setup/desire-category",
  "/onboarding/setup/home-focus",
  "/onboarding/setup/office-planning-system",
  "/onboarding/setup/moodboard-focus",
  "/onboarding/setup/conditional-specificity",
  "/onboarding/setup/current-friction",
  "/onboarding/setup/affirmations",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/attribution",
  "/onboarding/setup/intensity",
  "/onboarding/setup/notifications",
  "/onboarding/setup/tool-preference",
  "/onboarding/setup/workspace-template",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/email",
] as const;

/** Preserved suite web funnel for comprehensive-app ad work (`/onboarding/suite/...`). */
export const SUITE_WEB_ONBOARDING_ROUTES = [
  "/onboarding/suite/welcome",
  "/onboarding/suite/setup/name",
  "/onboarding/suite/setup/primary-intent",
  "/onboarding/suite/setup/desire-category",
  "/onboarding/suite/setup/home-focus",
  "/onboarding/suite/setup/office-planning-system",
  "/onboarding/suite/setup/moodboard-focus",
  "/onboarding/suite/setup/conditional-specificity",
  "/onboarding/suite/setup/current-friction",
  "/onboarding/suite/setup/affirmations",
  "/onboarding/suite/setup/begin-journey",
  "/onboarding/suite/setup/attribution",
  "/onboarding/suite/setup/intensity",
  "/onboarding/suite/setup/notifications",
  "/onboarding/suite/setup/tool-preference",
  "/onboarding/suite/setup/workspace-template",
  "/onboarding/suite/setup/plot-loading",
  "/onboarding/suite/setup/plot-synthesis",
  "/onboarding/suite/setup/email",
] as const;

/** Web default: subliminal-fast funnel (shorter path, name before account). */
export const WEB_FAST_ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/primary-intent",
  "/onboarding/setup/desire-category",
  "/onboarding/setup/home-focus",
  "/onboarding/setup/office-planning-system",
  "/onboarding/setup/moodboard-focus",
  "/onboarding/setup/conditional-specificity",
  "/onboarding/setup/tool-preference",
  "/onboarding/setup/workspace-template",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/attribution",
  "/onboarding/setup/intensity",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/name",
  "/onboarding/setup/email",
] as const;

/** Setup steps only (after Welcome, before pricing): used for top progress bar. */
export const ONBOARDING_SETUP_PROGRESS_ROUTES = ONBOARDING_ROUTES.slice(1, -1);

export const SUITE_WEB_SETUP_PROGRESS_ROUTES = SUITE_WEB_ONBOARDING_ROUTES.slice(1, -1);

export const WEB_FAST_SETUP_PROGRESS_ROUTES = WEB_FAST_ONBOARDING_ROUTES.slice(1, -1);

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Your Name",
  "Intent",
  "Specifics",
  "Friction",
  "Affirmations",
  "Your studio",
  "Found us",
  "Rhythm",
  "Permissions",
  "Tools",
  "Building room",
  "Your plot",
  "Account",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_ROUTES.length;
