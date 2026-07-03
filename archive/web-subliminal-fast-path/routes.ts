/** Archived web subliminal builder funnel — not routed on the public site. */

export const SUBLIMINAL_BUILDER_ONBOARDING_ROUTES = [
  "/onboarding/subliminal/welcomepre",
  "/onboarding/subliminal/welcome",
  "/onboarding/subliminal/setup/path-ready",
  "/onboarding/subliminal/setup/email",
  "/onboarding/subliminal/setup/plot-loading",
  "/onboarding/subliminal/get-the-app",
] as const;

export const SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES = [
  "/onboarding/subliminal/welcome#manifest",
  "/onboarding/subliminal/welcome#vocals",
  "/onboarding/subliminal/welcome#finetune",
  "/onboarding/subliminal/setup/path-ready",
  "/onboarding/subliminal/setup/email",
  "/onboarding/subliminal/setup/plot-loading",
] as const;

export const SUBLIMINAL_ONBOARDING_BOTTOM_SCENE_ROUTES = [
  "/onboarding/subliminal/setup/plot-loading",
  "/onboarding/subliminal/setup/name",
] as const;
