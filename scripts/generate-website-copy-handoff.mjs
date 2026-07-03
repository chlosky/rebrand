import fs from "fs";
import path from "path";

const base = "src/i18n/locales";
const outDir = "docs/locale-handoff";
const date = new Date().toISOString().slice(0, 10);

const websiteLocales = ["en", "de", "zh-Hans", "nl", "fr", "it", "pt-BR", "es-419"];
const localeLabels = {
  en: "EN",
  "es-419": "es-419",
  "pt-BR": "pt-BR",
  fr: "fr",
  de: "de",
  it: "it",
  "zh-Hans": "zh-Hans",
  nl: "nl",
};

const websiteKeyPrefixes = [
  "marketing.home.",
  "marketing.pricing.features.",
  "marketing.manifestationQuiz.",
  "marketing.whatIsPalettePlotting.",
];

const legalLocales = [
  { code: "EN", termsFile: null, privacyFile: null, termsPage: "src/pages/TermsOfService.tsx", privacyPage: "src/pages/PrivacyPolicy.tsx" },
  { code: "ES", termsFile: "src/pages/legal/TermsOfServiceContentES.tsx", privacyFile: "src/pages/legal/PrivacyPolicyContentES.tsx" },
  { code: "PT", termsFile: "src/pages/legal/TermsOfServiceContentPT.tsx", privacyFile: "src/pages/legal/PrivacyPolicyContentPT.tsx" },
  { code: "DE", termsFile: "src/pages/legal/TermsOfServiceContentDE.tsx", privacyFile: "src/pages/legal/PrivacyPolicyContentDE.tsx" },
  { code: "FR", termsFile: "src/pages/legal/TermsOfServiceContentFR.tsx", privacyFile: "src/pages/legal/PrivacyPolicyContentFR.tsx" },
  { code: "IT", termsFile: "src/pages/legal/TermsOfServiceContentIT.tsx", privacyFile: "src/pages/legal/PrivacyPolicyContentIT.tsx" },
  { code: "NL", termsFile: "src/pages/legal/TermsOfServiceContentNL.tsx", privacyFile: "src/pages/legal/PrivacyPolicyContentNL.tsx" },
  { code: "ZH", termsFile: "src/pages/legal/TermsOfServiceContentZH.tsx", privacyFile: "src/pages/legal/PrivacyPolicyContentZH.tsx" },
];

function walk(obj, prefix, flat) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === "object") walk(item, `${key}.${i}`, flat);
        else flat[`${key}.${i}`] = item;
      });
    } else if (v && typeof v === "object") {
      walk(v, key, flat);
    } else {
      flat[key] = v;
    }
  }
}

function loadWebsiteMarketing(loc) {
  const flat = {};
  const marketingPath = path.join(base, loc, "marketing.json");
  if (fs.existsSync(marketingPath)) {
    walk(JSON.parse(fs.readFileSync(marketingPath, "utf8")), "marketing", flat);
  }
  const quizPath = path.join(base, loc, "marketingManifestationQuiz.json");
  if (fs.existsSync(quizPath)) {
    walk(JSON.parse(fs.readFileSync(quizPath, "utf8")), "marketing.manifestationQuiz", flat);
  }
  const whatIsPath = path.join(base, loc, "marketingWhatIs.json");
  if (fs.existsSync(whatIsPath)) {
    walk(JSON.parse(fs.readFileSync(whatIsPath, "utf8")), "marketing.whatIsPalettePlotting", flat);
  }
  return flat;
}

function escCell(s) {
  return String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

function jsxToPlainText(source) {
  return source
    .replace(/import[\s\S]*?from\s+["'][^"']+["'];?\n?/g, "")
    .replace(/export function \w+\(\)\s*\{[\s\S]*?return\s*\(\s*/g, "")
    .replace(/^<>\s*/g, "")
    .replace(/\);\s*\}\s*$/g, "")
    .replace(/\{new Date\(\)[^}]+\}/g, "[DATE]")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|li|section)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\{`[^`]*`\}/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractEnglishLegalBlock(pagePath) {
  const raw = fs.readFileSync(pagePath, "utf8");
  const marker = "LocalizedTerms ?";
  const privacyMarker = "LocalizedPrivacy ?";
  const useMarker = raw.includes(privacyMarker) ? privacyMarker : marker;
  const start = raw.indexOf(useMarker);
  if (start < 0) return "";
  const elseIdx = raw.indexOf(") : (", start);
  const openFrag = raw.indexOf("<>", elseIdx);
  const closeFrag = raw.lastIndexOf("</>");
  if (elseIdx < 0 || openFrag < 0 || closeFrag < 0) return "";
  return jsxToPlainText(raw.slice(openFrag, closeFrag + 4));
}

function readLegalPlainText(entry, kind) {
  if (entry.code === "EN") {
    const page = kind === "terms" ? entry.termsPage : entry.privacyPage;
    return extractEnglishLegalBlock(page);
  }
  const file = kind === "terms" ? entry.termsFile : entry.privacyFile;
  return jsxToPlainText(fs.readFileSync(file, "utf8"));
}

const byLocale = {};
for (const loc of websiteLocales) {
  byLocale[loc] = loadWebsiteMarketing(loc);
}

const enKeys = Object.keys(byLocale.en).filter((k) =>
  websiteKeyPrefixes.some((p) => k.startsWith(p)),
);
const allKeys = [
  ...new Set([
    ...enKeys,
    ...websiteLocales.flatMap((loc) =>
      Object.keys(byLocale[loc]).filter((k) => websiteKeyPrefixes.some((p) => k.startsWith(p))),
    ),
  ]),
].sort();

const headerCols = websiteLocales.map((loc) => localeLabels[loc]).join(" | ");
let out = "";
out += `# Palette Plotting — Website copy handoff (all translated languages)\n\n`;
out += `Generated: ${date}. Micromanagement handoff for ChatGPT translation QA.\n\n`;
out += `**English is the reference column.** Compare every locale against EN.\n\n`;

out += "## Scope (website only — not in-app dashboard/onboarding)\n\n";
out += "| Area | Routes | Locales |\n";
out += "|------|--------|--------|\n";
out += "| Homepage | `/` | en, de, zh-Hans, nl, fr, it, pt-BR, es-419 |\n";
out += "| What is Palette Plotting | `/what-is-palette-plotting` | same |\n";
out += "| Manifestation quiz | `/quiz/blocking-manifestation` | same |\n";
out += "| Terms of Use + EULA | `/terms`, `/terms/{ES\\|PT\\|DE\\|FR\\|IT\\|NL\\|ZH}` | EN + 7 localized routes |\n";
out += "| Privacy Policy | `/privacy`, `/privacy/{ES\\|PT\\|DE\\|FR\\|IT\\|NL\\|ZH}` | EN + 7 localized routes |\n\n";

out += "**Not translated (stay English):** FAQ, Contact, Pricing, Billing, Blog, Community, Acceptable Use, DMCA, legal subpages other than Terms/Privacy.\n\n";
out += "**Language selector order (no English in picker):** Deutsch → 中文 → Nederlands → Français → Italiano → Português (BR) → Español\n\n";
out += "**Source files:**\n";
out += "- i18n: `src/i18n/locales/{locale}/marketing.json` (home + pricing.features), `marketingManifestationQuiz.json`, `marketingWhatIs.json`\n";
out += "- Legal: `src/pages/legal/TermsOfServiceContent{ES,PT,DE,FR,IT,NL,ZH}.tsx`, `PrivacyPolicyContent*.tsx`; English inline in `TermsOfService.tsx` / `PrivacyPolicy.tsx`\n\n";

out += "---\n\n# Section 1 — Homepage (`marketing.home.*`)\n\n";
out += `Keys: ${allKeys.filter((k) => k.startsWith("marketing.home.")).length}\n\n`;
out += `| Key | ${headerCols} |\n`;
out += `|-----|${websiteLocales.map(() => "------").join("|")}|\n`;
for (const k of allKeys.filter((k) => k.startsWith("marketing.home."))) {
  out += `| \`${k}\` | ${websiteLocales.map((loc) => escCell(byLocale[loc][k])).join(" | ")} |\n`;
}

out += "\n---\n\n# Section 2 — What is Palette Plotting (`marketing.whatIsPalettePlotting.*` + `marketing.pricing.features.*`)\n\n";
const whatIsKeys = allKeys.filter(
  (k) =>
    k.startsWith("marketing.whatIsPalettePlotting.") || k.startsWith("marketing.pricing.features."),
);
out += `Keys: ${whatIsKeys.length}\n\n`;
out += `| Key | ${headerCols} |\n`;
out += `|-----|${websiteLocales.map(() => "------").join("|")}|\n`;
for (const k of whatIsKeys) {
  out += `| \`${k}\` | ${websiteLocales.map((loc) => escCell(byLocale[loc][k])).join(" | ")} |\n`;
}

out += "\n---\n\n# Section 3 — Manifestation quiz (`marketing.manifestationQuiz.*`)\n\n";
const quizKeys = allKeys.filter((k) => k.startsWith("marketing.manifestationQuiz."));
out += `Keys: ${quizKeys.length}\n\n`;
out += `| Key | ${headerCols} |\n`;
out += `|-----|${websiteLocales.map(() => "------").join("|")}|\n`;
for (const k of quizKeys) {
  out += `| \`${k}\` | ${websiteLocales.map((loc) => escCell(byLocale[loc][k])).join(" | ")} |\n`;
}

out += "\n---\n\n# Section 4 — Terms of Use + EULA (full text per locale)\n\n";
out += "Plain text extracted from legal components. English from default branch in `TermsOfService.tsx`.\n\n";
for (const entry of legalLocales) {
  const text = readLegalPlainText(entry, "terms");
  out += `## Terms — ${entry.code}\n\n`;
  out += `Route: ${entry.code === "EN" ? "/terms" : `/terms/${entry.code}`}\n\n`;
  out += "```\n";
  out += text;
  out += "\n```\n\n";
}

out += "\n---\n\n# Section 5 — Privacy Policy (full text per locale)\n\n";
for (const entry of legalLocales) {
  const text = readLegalPlainText(entry, "privacy");
  out += `## Privacy — ${entry.code}\n\n`;
  out += `Route: ${entry.code === "EN" ? "/privacy" : `/privacy/${entry.code}`}\n\n`;
  out += "```\n";
  out += text;
  out += "\n```\n\n";
}

out += "\n---\n\n# Section 6 — Key counts\n\n";
out += `- Homepage keys: ${allKeys.filter((k) => k.startsWith("marketing.home.")).length}\n`;
out += `- What is + feature strip keys: ${whatIsKeys.length}\n`;
out += `- Quiz keys: ${quizKeys.length}\n`;
out += `- Legal locales: ${legalLocales.length} (EN + ES, PT, DE, FR, IT, NL, ZH)\n`;
out += `- Website i18n locales: ${websiteLocales.length}\n\n`;

out += "## QA checklist for ChatGPT\n\n";
out += "1. Every non-EN cell should be a complete, natural translation of the EN reference — not literal word-for-word if it sounds wrong in that market.\n";
out += "2. Manifestation community terms (3D, SP, scripting, Law of Assumption, mirror work, subliminals) should stay recognizable or use established local equivalents.\n";
out += "3. Legal: same section structure as EN; keep Palette Plotting LLC, support@paletteplot.com, Illinois governing law, Apple EULA third-party beneficiary language.\n";
out += "4. Homepage footer terms/privacy links resolve to localized routes when a website language is selected.\n";
out += "5. Flag missing keys (empty cells) or `[object Object]` — there should be none.\n\n";

out += `Regenerate: \`node scripts/generate-website-copy-handoff.mjs\`\n`;

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `WEBSITE-COPY-HANDOFF-${date}.md`);
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.length} chars, ${allKeys.length} i18n keys)`);
