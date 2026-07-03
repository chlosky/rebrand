import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = path.resolve(import.meta.dirname, "..");

const files = [
  "src/pages/onboarding/Welcome.tsx",
  "src/styles/welcome-web-effects.css",
  "src/components/onboarding/WelcomeCosmicBackground.tsx",
  "src/components/onboarding/OnboardingLayout.tsx",
  "src/lib/webOnboardingSessionInsert.ts",
  "index.html",
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

const overview = `# Web welcome page (/onboarding/welcome) — ChatGPT handoff

Generated: ${now}
Branch: ${branch}
Commit: ${commit}

---

## What this page is

Route: \`/onboarding/welcome\`

| Surface | Body component | Shell |
|---------|----------------|-------|
| **Web browser** | \`WelcomeBodyWeb\` — app icon, headline, iPhone mockup carousel, toolbar, community proof | \`OnboardingLayout\` cosmic deep-black (\`WelcomeCosmicBackground tone="deep-black"\`) |
| **Native app** | \`WelcomeBodyNative\` — logo, eyebrow, title, feature grid | Same layout, native safe-area padding |

CTA: web \`Make my subliminal\` → \`/onboarding/setup/name\`. Native \`Start my path\`.

---

## iPhone mockup architecture (web only)

Replaces hidden 3-step tiles (\`SHOW_WELCOME_WEB_STEP_TILES = false\`).

**Assets**
- Frame: \`/Transparent Base iPhone Mockup.png\` (1080×1920, transparent PNG)
- Carousel screens: \`/marketing/welcome-mockup-screens/subliminal-maker-*.png\` (4 slides, 4.5s auto-rotate)

**DOM layers** (\`WelcomeIphoneMockupWeb\` in \`Welcome.tsx\`) — **current architecture (filter/clip fix)**

\`\`\`
.sv-iphone-mockup-glow-wrap          height 13.75rem, overflow visible, isolation isolate
  <img.sv-iphone-frame-glow-source>  ONLY glow source — filter on PNG itself, mask fades bottom
  .sv-iphone-mockup-stack             z-1, NO filter
    .sv-iphone-mockup-visual          clip-path crops phone+carousel to 13.75rem, NO box-shadow
      .sv-iphone-mockup-screen-slot   carousel PNGs (never filtered)
      <img frame PNG>                 visible frame on top
\`\`\`

**Glow rules (do not break):**
- \`filter: drop-shadow\` ONLY on \`.sv-iphone-frame-glow-source\` (transparent frame PNG)
- NEVER on \`.sv-iphone-mockup-glow-wrap\`, \`.sv-iphone-mockup-stack\`, \`.sv-iphone-mockup-visual\`, or carousel imgs
- NEVER wrap the glow img in \`overflow: hidden\` or \`clip-path\` parents with filter on wrapper
- Height crop stays on \`.sv-iphone-mockup-visual\` via \`clip-path: inset(0 0 calc(100% - 13.75rem) 0)\`
- Optional elliptical ambient: \`.sv-iphone-mockup-glow-wrap::before\` (radial gradient, not a rectangle)

**Removed (caused rectangular glow box):**
- \`.sv-iphone-mockup-mobile-glow\` + \`.sv-iphone-mockup-mobile-glow-clip\`
- \`box-shadow: inset\` on \`.sv-iphone-mockup-visual\`
- \`filter\` on stack/wrapper layers

**Screen inset** (\`IPHONE_MOCKUP_SCREEN_INSET\`): top 5.625%, left 12.963%, width 73.611%, height 88.802%, borderRadius 6%.

**CSS file:** \`src/styles/welcome-web-effects.css\` — logo glow, mockup glow, process streak zone, headline underline.

---

## Mockup glow — pass/fail test

| Pass | Fail |
|------|------|
| Glow follows phone/frame silhouette | Visible rectangular pink box around mockup |
| Phone bottom cropped at 13.75rem | Phone scaled down instead of cropped |
| No glow from carousel screenshots | Carousel alpha included in filtered layer |
| Dark cosmic background visible around phone | Hard rectangular frame behind phone |

Test on **mobile Safari** and **TikTok in-app browser** (WebKit).

---

## Document chrome (welcome / onboarding)

- \`OnboardingLayout\` sets \`html/body/#root\` to \`#020104\` + gradient via \`!important\` when \`isCosmicShell\`.
- \`index.html\` \`syncStatusBar()\` also sets onboarding colors when path starts with \`/onboarding\` (returns early before dashboard logic).
- **Do not** conflate with tool-page \`#0f0d14\` document chrome — welcome is \`#020104\`.

---

## Do NOT touch (unless explicitly asked)

- Tool pages / \`tool-page-shell\` / dashboard safe-area refactors
- Native welcome body layout
- \`onboarding_sessions\` edge functions
- Post-paywall, setup steps beyond welcome shell

---

## Files in this handoff

`;

function extToLang(f) {
  if (f.endsWith(".html")) return "html";
  if (f.endsWith(".css")) return "css";
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

- [ ] Mockup glow follows frame silhouette — no rectangular box (Safari + TikTok WebView)
- [ ] Phone still cropped at 13.75rem bottom
- [ ] \`.sv-iphone-frame-glow-source\` is the only filtered element for mockup glow
- [ ] Carousel screens never inside a filtered/clipped glow wrapper
- [ ] Do not regress logo glow (\`.sv-logo-glow-wrap\`) or headline streaks
- [ ] Do not touch native welcome, CTA, toolbar, community proof, onboarding routing

Regenerate this file: \`node scripts/generate-welcome-page-handoff.mjs\`

`;

const outPath = path.join(root, "chatgpt-welcome-page-handoff.md");
fs.writeFileSync(outPath, out, "utf8");
console.log(`Wrote chatgpt-welcome-page-handoff.md (${files.length} files, commit ${commit})`);
