import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = path.resolve(import.meta.dirname, "..");

const files = [
  "index.html",
  "src/lib/appStore.ts",
  "src/lib/mobileStoreHandoff.ts",
  "src/lib/inAppBrowserDetection.ts",
  "src/lib/marketingSiteChrome.ts",
  "src/lib/marketingSitePaths.ts",
  "src/lib/appDocumentChrome.ts",
  "public/manifest.json",
  "src/components/marketing/MarketingStoreBadges.tsx",
  "src/components/marketing/MarketingAppDownload.tsx",
  "src/hooks/useMarketingStoreCta.tsx",
  "src/components/marketing/MobileStoreFallbackSheet.tsx",
  "src/lib/marketingGetApp.ts",
  "src/pages/GetAppStore.tsx",
  "src/components/WebGetAppAfterPurchaseDialog.tsx",
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

const overview = `# Apple Smart App Banner + App Store handoff — ChatGPT handoff

Generated: ${now}
Branch: ${branch}
Commit: ${commit}

---

## What the user sees (Safari screenshots)

On **mobile Safari**, iOS renders a **native system banner** at the top of every page:

- App icon, name ("Palette Plotting: Manifesta…"), subtitle, blue **Get** button
- This is **not** React UI — Safari reads \`<meta name="apple-itunes-app">\` from the document head
- Shows on **homepage, welcome, onboarding setup, dashboard web**, etc. — any route that loads the SPA shell
- User can dismiss with **X**; Apple controls re-show behavior

---

## Single source of truth for App Store ID

| Constant | Value | File |
|----------|-------|------|
| \`PALETTE_PLOTTING_APP_STORE_ID\` | \`6759469696\` | \`src/lib/appStore.ts\` |
| Smart App Banner meta | \`app-id=6759469696\` | \`index.html\` (must stay in sync) |
| App Store HTTPS URL | \`https://apps.apple.com/app/id6759469696\` | \`appStore.ts\` (id-only; slug URLs 500 on desktop) |
| Native iOS handoff | \`itms-apps://itunes.apple.com/app/id6759469696\` | \`mobileStoreHandoff.ts\` |

**There is no React component for the Smart App Banner.** Do not search for one.

---

## How it is "presented throughout" the site

### 1. Static meta in \`index.html\` (global, all routes)

\`\`\`html
<meta name="apple-itunes-app" content="app-id=6759469696" />
\`\`\`

- Loaded once when the Vite SPA bootstraps (\`index.html\` is the entry for every client route)
- **Never removed or updated** by JavaScript in this repo
- **Not** scoped to homepage only — welcome/onboarding get the same banner in Safari

Optional Apple params **not used today**: \`app-argument=...\` (deep link into app after install/open).

### 2. Related Apple \`<head>\` tags (NOT the Smart Banner, but same install ecosystem)

| Meta / link | Purpose |
|-------------|---------|
| \`apple-mobile-web-app-capable\` | Add to Home Screen / standalone PWA behavior |
| \`apple-mobile-web-app-title\` | Home screen label |
| \`apple-mobile-web-app-status-bar-style\` | Status bar; updated by \`syncStatusBar()\` in \`index.html\` + \`marketingSiteChrome.ts\` |
| \`apple-touch-icon\` | Icon when saving to home screen |
| \`link rel="preconnect" tools.applemediaservices.com\` | Warm CDN for **Download on the App Store** badge images |
| \`public/manifest.json\` | PWA manifest (separate from Smart Banner) |

### 3. \`index.html\` \`syncStatusBar()\` script (indirect)

- Polls \`pathname\` + watches \`data-app-appearance\` on \`<html>\`
- Updates \`theme-color\` and \`apple-mobile-web-app-status-bar-style\` per route (marketing black, onboarding cosmic, dashboard light/dark)
- **Does not touch** \`apple-itunes-app\` — banner meta is unchanged across routes

### 4. Explicit store CTAs (separate from Smart Banner)

When users tap **your** download UI (badges, hero CTAs, post-purchase dialog):

- \`appStore.ts\` — URLs + badge CDN assets (\`tools.applemediaservices.com\`)
- \`mobileStoreHandoff.ts\` — \`https://\` vs \`itms-apps://\` per browser
- \`inAppBrowserDetection.ts\` — TikTok/IG/Meta WebViews block plain App Store URLs
- \`useMarketingStoreCta.tsx\` + \`MobileStoreFallbackSheet.tsx\` — homepage badge taps + fallback sheet

These run on **homepage/marketing CTAs only** unless wired elsewhere. They do **not** control the Smart Banner.

---

## Where Smart Banner works vs does not

| Browser / context | Smart App Banner |
|-------------------|------------------|
| **Mobile Safari** (direct, organic, retargeting) | **Yes** — system UI |
| **TikTok / Instagram / Facebook in-app WebView** | **No** — meta is ignored |
| **Chrome iOS** | **No** — Apple banner is Safari-only |
| **Capacitor native app** | N/A — user already in app; same \`index.html\` loads in WebView but banner irrelevant |
| **Desktop Safari** | Typically no (mobile-oriented feature) |

For TikTok traffic, use explicit badge handoff (\`itms-apps://\`) + \`MobileStoreFallbackSheet\` on pages where \`MarketingStoreCtaProvider\` is mounted — **not** on \`/onboarding/*\` today.

---

## Architecture diagram

\`\`\`
index.html (every SPA route)
  └── <meta apple-itunes-app app-id=6759469696>  ← Smart Banner (Safari only)
  └── syncStatusBar()                             ← theme-color / status bar (all routes)
  └── apple-touch-icon, PWA manifest

src/lib/appStore.ts                               ← canonical ID + HTTPS store URL + badge CDN
src/lib/mobileStoreHandoff.ts                     ← itms-apps + intent:// for in-app browsers
src/lib/inAppBrowserDetection.ts                  ← TikTok etc. → blocksAppStore

Homepage only:
  useMarketingStoreCta → MarketingStoreBadges → getMobileStoreHref()
  MobileStoreFallbackSheet (when WebView blocks store)

Onboarding / welcome:
  Smart Banner only (Safari) — no MarketingStoreCtaProvider
\`\`\`

---

## Changing the App Store ID

1. Update \`PALETTE_PLOTTING_APP_STORE_ID\` in \`src/lib/appStore.ts\`
2. Update \`index.html\` \`apple-itunes-app\` \`app-id=\` to match
3. Rebuild + redeploy web
4. Verify in **mobile Safari** on welcome + homepage
5. TikTok/native SDK IDs are separate (see \`chatgpt-tiktok-sdk-handoff.md\`)

---

## Files in this handoff

`;

function extToLang(f) {
  if (f.endsWith(".json")) return "json";
  if (f.endsWith(".html")) return "html";
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

- [ ] \`app-id\` in \`index.html\` matches \`PALETTE_PLOTTING_APP_STORE_ID\` in \`appStore.ts\`
- [ ] Smart Banner is **Safari-only** — do not expect it in TikTok WebView
- [ ] No React code toggles \`apple-itunes-app\` — banner is static global meta
- [ ] \`syncStatusBar\` updates status bar chrome only, not the banner
- [ ] Explicit store CTAs use \`mobileStoreHandoff\` + \`inAppBrowserDetection\` (homepage); onboarding relies on banner in Safari only
- [ ] Badge images from \`tools.applemediaservices.com\` — preconnect in \`index.html\`
- [ ] Consider \`app-argument\` on meta if deep-linking from web → app is needed later

`;

const outPath = path.join(root, "chatgpt-apple-smart-app-banner-handoff.md");
fs.writeFileSync(outPath, out, "utf8");
console.log(`Wrote chatgpt-apple-smart-app-banner-handoff.md (${files.length} files, commit ${commit})`);
