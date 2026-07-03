import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const files = [
  "src/components/WebGetAppAfterPurchaseDialog.tsx",
  "src/lib/webFirstPurchaseGetAppPrompt.ts",
  "src/lib/appStore.ts",
  "src/components/marketing/MarketingStoreBadges.tsx",
  "src/pages/onboarding/WebPaywall.tsx",
  "src/lib/inAppBrowserDetection.ts",
  "src/lib/mobileStoreHandoff.ts",
  "src/hooks/use-mobile.tsx",
  "src/components/ui/dialog.tsx",
];

const header = `# Web Get-the-app post-purchase popup - ChatGPT handoff

**Repo:** belief-craft-nexus
**Branch:** Mobile-app
**Base commit (last pushed):** ff71427b
**Status:** Local / uncommitted (popup feature)

---

## Summary

One-time browser modal after first successful **web** RevenueCat checkout.

- **Desktop:** App Store + Google Play QR codes (HTTPS links)
- **Mobile web:** Store badges — **App Store left, Google Play right**
- **Mobile badges:** Same in-app handoff as homepage (\`getMobileStoreHref\` + \`detectInAppBrowser\`) — \`itms-apps://\` / Play \`intent://\` in TikTok/IG/Meta WebViews

Does **not** show on \`/onboarding/*\`, \`/payment-processing\`, or \`/activate\`. Native app: no popup.

**Copy:** Get Palette Plotting on your phone / Your membership is best experienced in the app. Scan or tap to install.

---

## Flow

\`WebPaywall\` purchase OK -> \`armWebGetAppPromptPending()\` -> \`/onboarding/post-paywall\` -> \`/dashboard\` -> dialog (~500ms).

---

## localStorage

| Key | Meaning |
|-----|---------|
| \`sv_web_get_app_prompt_pending_v1\` | Armed after web purchase |
| \`sv_web_get_app_prompt_shown_v1\` | Dismissed; never show again (per browser) |
| \`sv_web_get_app_preview_v1\` | Dev preview |

---

## Preview (dev :8080)

- URL: \`http://localhost:8080/?preview=get-app-dialog\`
- Console: \`previewGetAppDialog()\` / \`clearGetAppDialogPreview()\`

---

## App.tsx

\`\`\`tsx
import { WebGetAppAfterPurchaseDialog } from "@/components/WebGetAppAfterPurchaseDialog";
// inside BrowserRouter after ScrollToTop:
<WebGetAppAfterPurchaseDialog />
\`\`\`

---

## index.html (preconnect)

\`\`\`html
<link rel="preconnect" href="https://play.google.com" crossorigin />
<link rel="preconnect" href="https://tools.applemediaservices.com" crossorigin />
\`\`\`

---

## NOT modified

- PostPaywallLoading.tsx, OnboardingLayout.tsx, native paywalls UI

---

## Files

`;

let out = header + files.map((f) => `- ${f}`).join("\n") + "\n\n";

for (const f of files) {
  const ext = f.endsWith(".tsx") ? "tsx" : "ts";
  const content = fs.readFileSync(path.join(root, f), "utf8");
  out += `## FILE: ${f}\n\n\`\`\`${ext}\n${content}\n\`\`\`\n\n---\n\n`;
}

out += `## ChatGPT review checklist

1. Blocked routes include /onboarding/post-paywall
2. Badges use getStoreHref like homepage (mobileStoreHandoff.ts)
3. Badge DOM order: apple then google
4. preloadStoreBadgeImages prefetches Google CDN first (network only)
5. Preview close does not set shown
6. Native: component returns null
`;

const outPath = path.join(root, "chatgpt-web-get-app-popup-handoff.md");
fs.writeFileSync(outPath, out);
console.log("Wrote", outPath, out.length, "bytes");
