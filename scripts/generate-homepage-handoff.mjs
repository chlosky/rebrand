import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const files = [
  "src/pages/Index.tsx",
  "src/components/MarketingSiteHeader.tsx",
  "src/components/marketing/MarketingHeader.tsx",
  "src/components/marketing/MarketingHero.tsx",
  "src/components/marketing/MarketingHeroCopy.tsx",
  "src/components/marketing/MarketingHeroStaticPhone.tsx",
  "src/components/marketing/MarketingStoreBadges.tsx",
  "src/components/marketing/MarketingConversionCta.tsx",
  "src/components/marketing/MarketingStickyDownloadBar.tsx",
  "src/components/marketing/MobileStoreFallbackSheet.tsx",
  "src/components/marketing/MarketingToolsStrip.tsx",
  "src/components/marketing/MarketingManifestPanel.tsx",
  "src/components/marketing/MarketingPracticeTopics.tsx",
  "src/components/marketing/MarketingStats.tsx",
  "src/components/marketing/MarketingTestimonials.tsx",
  "src/components/marketing/MarketingAppScreenshotsTicker.tsx",
  "src/components/marketing/MarketingAppDownload.tsx",
  "src/components/marketing/MarketingNewsletterSignup.tsx",
  "src/components/marketing/MarketingFooter.tsx",
  "src/components/marketing/MarketingCosmicBackground.tsx",
  "src/components/marketing/marketingLayout.ts",
  "src/components/marketing/marketingVisualTheme.ts",
  "src/components/marketing/marketingCopy.ts",
  "src/components/marketing/marketingAppScreenshots.ts",
  "src/lib/marketingConversionCopy.ts",
  "src/lib/useMarketingAttribution.ts",
  "src/hooks/useMarketingStoreCta.tsx",
  "src/hooks/use-mobile.tsx",
  "src/lib/marketingGetApp.ts",
  "src/lib/mobileStoreHandoff.ts",
  "src/lib/mobileStoreHandoffDebug.ts",
  "src/lib/mobileStoreFallbackScheduler.ts",
  "src/lib/marketingConversionTrack.ts",
  "src/lib/inAppBrowserDetection.ts",
  "src/lib/marketingViewportDebug.ts",
  "src/lib/appStore.ts",
  "src/lib/scrollToDownloadApp.ts",
  "src/lib/scrollToNewsletter.ts",
  "index.html",
  "public/manifest.json",
];

const commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
const now = new Date().toISOString().slice(0, 16).replace("T", " ");

let out = "# Homepage handoff — Palette Plotting (route `/`, Index.tsx)\n\n";
out += `Generated: ${now}\n`;
out += `Branch: ${branch}\n`;
out += `Commit: ${commit}\n\n`;
out += "---\n\n";

for (const f of files) {
  const full = path.join(process.cwd(), f);
  if (!fs.existsSync(full)) {
    console.error("MISSING:", f);
    process.exit(1);
  }
  const content = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
  const lang = f.endsWith(".json") ? "json" : f.endsWith(".html") ? "html" : "tsx";
  out += `## ${f}\n\n`;
  out += "```" + lang + "\n";
  out += content;
  if (!content.endsWith("\n")) out += "\n";
  out += "```\n\n---\n\n";
}

fs.writeFileSync("chatgpt-homepage-handoff.md", out, "utf8");
console.log(`Wrote chatgpt-homepage-handoff.md (${files.length} files, commit ${commit})`);
