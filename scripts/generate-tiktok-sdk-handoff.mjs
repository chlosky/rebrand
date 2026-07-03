import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const files = [
  // --- docs & native iOS SDK ---
  "docs/TIKTOK_IOS_SDK.md",
  "ios/App/App/TikTokSdkBootstrap.swift",
  "ios/App/App/AppDelegate.swift",
  "ios/App/App/Info.plist",
  "ios/App/App.xcodeproj/project.pbxproj",
  "codemagic.yaml",
  // --- web pixel & conversion tracking ---
  "index.html",
  "src/lib/marketingConversionTrack.ts",
  "src/lib/useMarketingAttribution.ts",
  "src/lib/inAppBrowserDetection.ts",
  "src/lib/mobileStoreHandoff.ts",
  "src/lib/marketingGetApp.ts",
  "src/lib/mobileStoreHandoffDebug.ts",
  "src/lib/mobileStoreFallbackScheduler.ts",
  "src/lib/appStore.ts",
  // --- store CTA wiring (TikTok webview handoff) ---
  "src/hooks/useMarketingStoreCta.tsx",
  "src/components/marketing/MobileStoreFallbackSheet.tsx",
  "src/components/marketing/MarketingStoreBadges.tsx",
  // --- conversion event callers ---
  "src/pages/Index.tsx",
  "src/components/marketing/MarketingHeader.tsx",
  "src/components/marketing/MarketingHero.tsx",
  "src/components/marketing/MarketingAppDownload.tsx",
  "src/components/marketing/MarketingConversionCta.tsx",
  "src/components/marketing/MarketingNewsletterSignup.tsx",
  "src/components/marketing/MarketingWebCta.tsx",
];

const commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
const now = new Date().toISOString().slice(0, 16).replace("T", " ");

const overview = `# TikTok SDK handoff — Palette Plotting

Generated: ${now}
Branch: ${branch}
Commit: ${commit}

---

## Architecture overview

Palette Plotting has **two separate TikTok measurement surfaces** — do not conflate their IDs:

| Surface | What it measures | ID source | Key files |
|---------|------------------|-----------|-------------|
| **TikTok Pixel (web)** | Homepage / marketing site events in browser | **Pixel 062026** — \`D8ERPC3C77U91RGD4HQG\` in \`index.html\` | \`index.html\`, \`marketingConversionTrack.ts\` |
| **TikTok App Events SDK (iOS native)** | Install, Launch, Retention, StoreKit Purchase in the Capacitor app | Events Manager → App Secret, App ID, TikTok App ID → injected into \`Info.plist\` at CI | \`TikTokSdkBootstrap.swift\`, \`AppDelegate.swift\`, \`codemagic.yaml\` |

There is **no Android TikTok SDK** in this repo today.

### Native iOS flow

1. \`AppDelegate.application(_:didFinishLaunchingWithOptions:)\` → \`TikTokSdkBootstrap.configureOnLaunch()\`
2. Reads \`TikTokAccessToken\`, \`TikTokAppId\`, \`TikTokTikTokAppId\` from \`Info.plist\`
3. Skips init if any value is empty or \`REPLACE_*\` placeholder (safe for local dev)
4. \`applicationDidBecomeActive\` → \`TikTokSdkBootstrap.requestTrackingAuthorizationOnBecomeActive()\` (ATT / IDFA)
5. Codemagic injects secrets from \`TIKTOK_IOS_APP_SECRET\`, \`TIKTOK_IOS_APP_ID\`, \`TIKTOK_IOS_TIKTOK_APP_ID\` after \`cap sync ios\`
6. SPM package: \`tiktok-business-ios-sdk\` ≥ 1.6.0; linker flags \`-ObjC\`, \`-lc++\`

### Web pixel flow

1. \`index.html\` loads \`ttq\` with **Pixel 062026** (\`D8ERPC3C77U91RGD4HQG\`); fires \`ttq.page()\` on load
2. \`trackMarketingConversion(action, detail)\` fans out to gtag, **ttq**, dataLayer, sessionStorage breadcrumb
3. Internal actions map to TikTok standard events (e.g. \`landing_view\` → \`ViewContent\`, store clicks → \`ClickButton\` + \`Download\`)
4. \`paywall_view\` / \`subscription_complete\` are defined but **not yet called** anywhere — reserved for web paywall funnel

### TikTok paid-traffic conversion path (indirect but critical)

TikTok ads open the site in an **in-app WebView** that blocks plain \`https://apps.apple.com\` links. Mitigation stack:

1. \`inAppBrowserDetection.ts\` — UA detects \`musical_ly\`, \`Bytedance\`, \`TikTok\` → \`kind: "tiktok"\`, \`blocksAppStore: true\`
2. \`mobileStoreHandoff.ts\` — switches href to \`itms-apps://\` (iOS) or Play \`intent://\` (Android) on real \`<a>\` tags
3. \`useMarketingStoreCta.tsx\` — central store CTA provider; schedules fallback sheet if store didn't open
4. \`MobileStoreFallbackSheet.tsx\` — "Copy app link / open in Safari" UX when WebView blocks handoff
5. Store clicks attach \`from_tiktok\`, \`ttclid\`, UTM params to TikTok pixel events via \`marketingGetApp.ts\`

### Attribution (analytics only — does not change UX)

\`useMarketingAttribution.ts\` persists UTM params in sessionStorage and sets \`isFromTikTok\` when \`utm_source\` contains \`tiktok\` or equals \`tt\`. Passed as \`from_tiktok\` on conversion events.

### Credential cheat sheet

| TikTok Events Manager label | Native SDK param | Info.plist key | Codemagic var |
|-----------------------------|------------------|----------------|---------------|
| App Secret | \`accessToken\` | \`TikTokAccessToken\` | \`TIKTOK_IOS_APP_SECRET\` |
| App ID (numeric, e.g. 6759469696) | \`appId\` | \`TikTokAppId\` | \`TIKTOK_IOS_APP_ID\` |
| TikTok App ID (long numeric) | \`tiktokAppId\` | \`TikTokTikTokAppId\` | \`TIKTOK_IOS_TIKTOK_APP_ID\` |
| Web Pixel ID | N/A (web only) | N/A | N/A — hardcoded in \`index.html\` |

**Do not** use bundle id or web pixel id for native \`tiktokAppId\`.

### Verify

- **Web:** TikTok Events Manager → Web pixel → Test events; browse homepage with \`?utm_source=tiktok\`
- **iOS:** TestFlight build with Codemagic-injected credentials → physical device → accept ATT → Events Manager → Test event
- **WebView handoff:** Open homepage from TikTok app → tap store badge → should use \`itms-apps://\`; fallback sheet after ~900ms if still visible

---

`;

function extToLang(f) {
  if (f.endsWith(".json")) return "json";
  if (f.endsWith(".html")) return "html";
  if (f.endsWith(".yaml") || f.endsWith(".yml")) return "yaml";
  if (f.endsWith(".md")) return "markdown";
  if (f.endsWith(".swift")) return "swift";
  if (f.endsWith(".plist")) return "xml";
  if (f.endsWith(".pbxproj")) return "text";
  return "tsx";
}

let out = overview;

for (const f of files) {
  const full = path.join(process.cwd(), f);
  if (!fs.existsSync(full)) {
    console.error("MISSING:", f);
    process.exit(1);
  }
  const content = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
  const lang = extToLang(f);
  out += `## ${f}\n\n`;
  out += "```" + lang + "\n";
  out += content;
  if (!content.endsWith("\n")) out += "\n";
  out += "```\n\n---\n\n";
}

fs.writeFileSync("chatgpt-tiktok-sdk-handoff.md", out, "utf8");
console.log(`Wrote chatgpt-tiktok-sdk-handoff.md (${files.length} files, commit ${commit})`);
