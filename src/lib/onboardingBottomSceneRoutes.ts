/** Setup pages that show the low bottom-scene overlay (fixed, non-layout-affecting). */
export const ONBOARDING_BOTTOM_SCENE_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/suite/welcome",
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
  "/onboarding/setup/tool-preference",
  "/onboarding/setup/workspace-template",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
] as const;

export function shouldShowSetupBottomScene(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if ((ONBOARDING_BOTTOM_SCENE_ROUTES as readonly string[]).includes(path)) return true;
  if (!path.startsWith("/onboarding/suite/setup/")) return false;
  const suffix = path.slice("/onboarding/suite/setup/".length);
  return ONBOARDING_BOTTOM_SCENE_ROUTES.some((r) => r.endsWith(`/${suffix}`));
}
