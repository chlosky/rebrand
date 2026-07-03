# Web subliminal fast path (archived)

This folder holds the retired web subliminal builder funnel. It is **not** linked from marketing CTAs and **not** registered in `App.tsx` routes.

Public traffic to `/onboarding/subliminal/*` is redirected to the homepage (`main.tsx` + `App.tsx`).

Starter subliminals are created via standard post-paywall provisioning in the app.

To revive locally for reference, temporarily wire these components back into `App.tsx` under a dev-only flag — do not ship without product sign-off.
