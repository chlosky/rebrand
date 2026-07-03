import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = path.resolve(import.meta.dirname, "..");

const files = [
  "supabase/migrations/20260530140000_web_onboarding_sessions.sql",
  "src/lib/webOnboardingSessionInsert.ts",
  "src/lib/onboardingFlow.ts",
  "src/pages/onboarding/Welcome.tsx",
  "src/components/onboarding/OnboardingLayout.tsx",
  "src/components/onboarding/SetupPage.tsx",
  "src/pages/onboarding/setup/Name.tsx",
  "src/pages/onboarding/WebPaywall.tsx",
  "src/services/revenueCatWeb.ts",
  "src/lib/runWebPaywallFlow.ts",
  "index.html",
  "src/lib/inAppBrowserDetection.ts",
  "src/lib/useMarketingAttribution.ts",
  "src/hooks/useMarketingStoreCta.tsx",
  "src/lib/marketingConversionTrack.ts",
  "src/App.tsx",
];

let commit = "unknown";
let branch = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { encoding: "utf8", cwd: root }).trim();
  branch = execSync("git branch --show-current", { encoding: "utf8", cwd: root }).trim();
} catch {
  /* ignore */
}

const now = new Date().toISOString().slice(0, 16).replace("T", " ");

const overview = `# Web onboarding funnel — ChatGPT handoff

Generated: ${now}
Branch: ${branch}
Commit: ${commit}

---

## Summary

Web onboarding is a **browser-only** cosmic-shell funnel: welcome → setup steps → email → RevenueCat web paywall → post-paywall → dashboard.

**Separate from native app** (\`Capacitor.isNativePlatform()\` skips web-only analytics and uses native paywalls).

**Separate from payment-first \`onboarding_sessions\`** edge functions — \`web_onboarding_sessions\` is analytics-only.

---

## Canonical route order

See \`src/lib/onboardingFlow.ts\`:

1. \`/onboarding/welcome\`
2. \`/onboarding/setup/name\` … \`/onboarding/setup/plot-synthesis\`
3. \`/onboarding/setup/email\`
4. \`/onboarding/web-paywall\` (RevenueCat \`purchases-js\`)
5. \`/onboarding/post-paywall\` → \`/dashboard\`

Legacy routes (\`/onboarding/four-steps\`, \`/onboarding/email\`, etc.) still exist in \`App.tsx\` but are not the current web path.

---

## Web welcome analytics (\`web_onboarding_sessions\`)

| Item | Detail |
|------|--------|
| Table | \`web_onboarding_sessions\` — migration must be applied (\`supabase db push\`) |
| Trigger | \`recordWebOnboardingSessionStart()\` on \`Welcome.tsx\` when \`!isNative\` |
| Dedupe | \`sessionStorage\` keys \`sv_web_onboarding_client_visit_v1\`, \`sv_web_onboarding_session_recorded_v1\` |
| Safety | Fire-and-forget; failures swallowed. **Does not touch** \`onboarding_sessions\` or edge functions |
| TikTok flag | \`from_tiktok\` from \`useMarketingAttribution\` (UTM \`utm_source\` contains \`tiktok\` or \`tt\`) |

---

## Welcome web CTA copy

- **Native:** \`Start my path\`
- **Web:** \`sign up + download app + start manifesting\` (wrap-friendly button classes on welcome)

Button navigates to \`/onboarding/setup/name\` — **not** the App Store.

---

## App link at top (Safari vs TikTok) — important

| Surface | Welcome / onboarding top app promo |
|---------|-----------------------------------|
| **Mobile Safari** | **Yes** — Apple **Smart App Banner** from \`index.html\` \`apple-itunes-app\` meta (\`app-id=6759469696\`). System UI, not React. |
| **TikTok / IG / FB in-app WebView** | **No** — meta tag is a no-op in restricted WebViews |
| **Custom React header on onboarding** | **No** — \`OnboardingLayout\` has desktop-only "Palette Plotting" text linking home; mobile has safe-area padding only |
| **Homepage only** | \`MarketingStoreCtaProvider\`, sticky download bar, \`MobileStoreFallbackSheet\` — **not mounted** on \`/onboarding/*\` |

TikTok paid traffic that lands directly on \`/onboarding/welcome\` gets **no** in-app fallback sheet unless you add it.

Post-purchase: \`WebGetAppAfterPurchaseDialog\` on dashboard (see \`chatgpt-web-get-app-popup-handoff.md\`).

---

## Google Analytics / gtag gaps

- \`gtag\` + GTM loaded in \`index.html\` (\`G-QQX552G8JN\`, \`GTM-N6QFTP58\`)
- Homepage fires \`trackMarketingConversion('landing_view')\` and \`cta_web_onboarding_click\` on CTA tap
- **Onboarding pages:** no \`document.title\` per step, no SPA \`page_view\` hook, no \`paywall_view\` / \`subscription_complete\` calls (defined but unused)
- GA may still see paths via Enhanced Measurement history events — page title stays "Palette Plotting"
- Step labels exist in \`ONBOARDING_STEP_LABELS\` but are not sent to GA

---

## RevenueCat web paywall / coupons

Web checkout uses \`presentWebRevenueCatPaywall()\` → \`purchases.presentPaywall()\` with \`htmlTarget\` + \`customerEmail\` only.

- Legacy Stripe edge functions have \`allow_promotion_codes=true\` but web flow **does not use them**
- RC coupons: RevenueCat dashboard + optional \`showDiscountCodeField\` / \`discountCode\` on \`presentPaywall\` (not wired in app)
- Supabase \`referral_codes\` not connected to web paywall

---

## Do NOT touch

- \`onboarding_sessions\` table and edge functions (\`create-onboarding-session\`, etc.) for this analytics work
- \`Mobile-App\` branch (Codemagic native line) — web work lives on \`Mobile-app\`
- Native paywall routes (\`ios-paywall\`, \`android-paywall\`)

---

## Files in this handoff

`;

function extToLang(f) {
  if (f.endsWith(".sql")) return "sql";
  if (f.endsWith(".html")) return "html";
  if (f.endsWith(".mjs")) return "javascript";
  if (f.endsWith(".ts") && !f.endsWith(".tsx")) return "typescript";
  return "tsx";
}

let out = overview + files.map((f) => `- ${f}`).join("\n") + "\n\n";

for (const f of files) {
  const full = path.join(root, f);
  if (!fs.existsSync(full)) {
    console.error("MISSING:", f);
    process.exit(1);
  }
  const content = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
  const lang = extToLang(f);
  out += `## FILE: ${f}\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n---\n\n`;
}

out += `## ChatGPT review checklist

- [ ] \`web_onboarding_sessions\` migration applied in Supabase prod
- [ ] Welcome insert fires once per tab on browser only (not native)
- [ ] Safari Smart App Banner expected on welcome/setup; TikTok in-app has no top banner
- [ ] Onboarding has no \`MarketingStoreCtaProvider\` — intentional gap for TikTok direct-to-welcome?
- [ ] GA funnel: consider \`page_view\` + per-step \`document.title\` from \`ONBOARDING_STEP_LABELS\`
- [ ] RC coupons: dashboard config + optional \`showDiscountCodeField\` in \`revenueCatWeb.ts\`
- [ ] Does not modify \`onboarding_sessions\` or edge functions

`;

const outPath = path.join(root, "chatgpt-web-onboarding-handoff.md");
fs.writeFileSync(outPath, out, "utf8");
console.log(`Wrote chatgpt-web-onboarding-handoff.md (${files.length} files, commit ${commit})`);
