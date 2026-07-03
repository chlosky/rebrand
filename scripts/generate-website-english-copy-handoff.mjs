import fs from "fs";
import path from "path";

const base = "src/i18n/locales/en";
const outDir = "docs/locale-handoff";
const date = new Date().toISOString().slice(0, 10);

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

function loadEnMarketing() {
  const flat = {};
  walk(JSON.parse(fs.readFileSync(path.join(base, "marketing.json"), "utf8")), "marketing", flat);
  walk(
    JSON.parse(fs.readFileSync(path.join(base, "marketingManifestationQuiz.json"), "utf8")),
    "marketing.manifestationQuiz",
    flat,
  );
  walk(
    JSON.parse(fs.readFileSync(path.join(base, "marketingWhatIs.json"), "utf8")),
    "marketing.whatIsPalettePlotting",
    flat,
  );
  return flat;
}

function jsxToPlainText(source) {
  return source
    .replace(/import[\s\S]*?from\s+["'][^"']+["'];?\n?/g, "")
    .replace(/export (default )?function \w+[\s\S]*?return\s*\(\s*/g, "")
    .replace(/const \w+ = \(\) => \{[\s\S]*?return\s*\(\s*/g, "")
    .replace(/^<>\s*/g, "")
    .replace(/\);\s*\};?\s*$/g, "")
    .replace(/\{new Date\(\)[^}]+\}/g, "[DATE]")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|h4|li|section|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\{`[^`]*`\}/g, "")
    .replace(/\{PALETTE_PLOTTING_[A-Z_]+\}/g, "[URL]")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractEnglishLegalBlock(pagePath) {
  const raw = fs.readFileSync(pagePath, "utf8");
  const marker = raw.includes("LocalizedPrivacy ?") ? "LocalizedPrivacy ?" : "LocalizedTerms ?";
  const elseIdx = raw.indexOf(") : (", raw.indexOf(marker));
  const openFrag = raw.indexOf("<>", elseIdx);
  const closeFrag = raw.lastIndexOf("</>");
  if (elseIdx < 0 || openFrag < 0 || closeFrag < 0) return "";
  return jsxToPlainText(raw.slice(openFrag, closeFrag + 4));
}

function extractCardPageText(pagePath) {
  const raw = fs.readFileSync(pagePath, "utf8");
  const start = raw.indexOf("<CardContent");
  const end = raw.indexOf("</CardContent>", start);
  if (start < 0 || end < 0) return jsxToPlainText(raw);
  return jsxToPlainText(raw.slice(start, end));
}

function extractCommunityText() {
  const raw = fs.readFileSync("src/pages/Community.tsx", "utf8");
  const start = raw.indexOf('<div className="container mx-auto max-w-4xl');
  const end = raw.indexOf("</MarketingSiteLayout>");
  return jsxToPlainText(raw.slice(start, end));
}

function sectionKeys(flat, prefix) {
  return Object.keys(flat)
    .filter((k) => k.startsWith(prefix))
    .sort();
}

function writeKeyBlock(out, flat, keys) {
  for (const k of keys) {
    out.push(`### \`${k}\``);
    out.push("");
    out.push(String(flat[k] ?? ""));
    out.push("");
  }
}

const flat = loadEnMarketing();
const lines = [];

lines.push("# Palette Plotting — Website English copy (source of truth)");
lines.push("");
lines.push(`Generated: ${date}. Send this file to ChatGPT to produce translations.`);
lines.push("");
lines.push("## How to use with ChatGPT");
lines.push("");
lines.push("1. Upload this entire document.");
lines.push("2. Ask ChatGPT to translate each section into your target language(s).");
lines.push("3. Return translations using the **same keys** (for i18n sections) or **same section headings** (for legal pages).");
lines.push("4. Keep brand name **Palette Plotting**, email **support@paletteplot.com**, and store names (App Store, Google Play) unless a locale has a standard local form.");
lines.push("5. Manifestation terms (3D, SP, scripting, Law of Assumption, mirror work, subliminals) should stay recognizable in each market.");
lines.push("");
lines.push("## Pages covered");
lines.push("");
lines.push("| Page | Route | Format in this doc |");
lines.push("|------|-------|-------------------|");
lines.push("| Homepage | `/` | i18n keys `marketing.home.*` |");
lines.push("| Pricing | `/pricingplans` | i18n keys `marketing.pricing.*` |");
lines.push("| Contact | `/contact` | i18n keys `marketing.contact.*` |");
lines.push("| FAQ | `/faq` | i18n keys `marketing.faq.*` |");
lines.push("| What is Palette Plotting | `/what-is-palette-plotting` | i18n keys `marketing.whatIsPalettePlotting.*` + feature strip |");
lines.push("| Manifestation quiz | `/quiz/blocking-manifestation` | i18n keys `marketing.manifestationQuiz.*` |");
lines.push("| Terms + EULA | `/terms` | Full plain text |");
lines.push("| Privacy | `/privacy` | Full plain text |");
lines.push("| Acceptable Use | `/acceptable-use` | Full plain text |");
lines.push("| Billing & Refunds | `/billing` | Full plain text |");
lines.push("| DMCA | `/dmca` | Full plain text |");
lines.push("| Community | `/community` | Full plain text (hardcoded TSX) |");
lines.push("");
lines.push("---");
lines.push("");
lines.push("# Section 1 — Homepage (`marketing.home.*`)");
lines.push("");
writeKeyBlock(lines, flat, sectionKeys(flat, "marketing.home."));

lines.push("---");
lines.push("");
lines.push("# Section 2 — Pricing page (`marketing.pricing.*`)");
lines.push("");
writeKeyBlock(lines, flat, sectionKeys(flat, "marketing.pricing."));

lines.push("---");
lines.push("");
lines.push("# Section 3 — Contact page (`marketing.contact.*`)");
lines.push("");
writeKeyBlock(lines, flat, sectionKeys(flat, "marketing.contact."));

lines.push("---");
lines.push("");
lines.push("# Section 4 — FAQ (`marketing.faq.*`)");
lines.push("");
writeKeyBlock(lines, flat, sectionKeys(flat, "marketing.faq."));

lines.push("---");
lines.push("");
lines.push("# Section 5 — What is Palette Plotting");
lines.push("");
writeKeyBlock(lines, flat, sectionKeys(flat, "marketing.whatIsPalettePlotting."));

lines.push("---");
lines.push("");
lines.push("# Section 6 — Manifestation quiz (`marketing.manifestationQuiz.*`)");
lines.push("");
writeKeyBlock(lines, flat, sectionKeys(flat, "marketing.manifestationQuiz."));

lines.push("---");
lines.push("");
lines.push("# Section 7 — Terms of Use + EULA (`/terms`)");
lines.push("");
lines.push("```");
lines.push(extractEnglishLegalBlock("src/pages/TermsOfService.tsx"));
lines.push("```");
lines.push("");

lines.push("---");
lines.push("");
lines.push("# Section 8 — Privacy Policy (`/privacy`)");
lines.push("");
lines.push("```");
lines.push(extractEnglishLegalBlock("src/pages/PrivacyPolicy.tsx"));
lines.push("```");
lines.push("");

lines.push("---");
lines.push("");
lines.push("# Section 9 — Acceptable Use Policy (`/acceptable-use`)");
lines.push("");
lines.push("```");
lines.push(extractCardPageText("src/pages/AcceptableUsePolicy.tsx"));
lines.push("```");
lines.push("");

lines.push("---");
lines.push("");
lines.push("# Section 10 — Billing & Refund Policy (`/billing`)");
lines.push("");
lines.push("```");
lines.push(extractCardPageText("src/pages/BillingRefundPolicy.tsx"));
lines.push("```");
lines.push("");

lines.push("---");
lines.push("");
lines.push("# Section 11 — DMCA Notice & Takedown Policy (`/dmca`)");
lines.push("");
lines.push("```");
lines.push(extractCardPageText("src/pages/DMCA.tsx"));
lines.push("```");
lines.push("");

lines.push("---");
lines.push("");
lines.push("# Section 12 — Community page (`/community`)");
lines.push("");
lines.push("```");
lines.push(extractCommunityText());
lines.push("```");
lines.push("");

lines.push("---");
lines.push("");
lines.push("# Section 13 — Key counts");
lines.push("");
lines.push(`- Homepage keys: ${sectionKeys(flat, "marketing.home.").length}`);
lines.push(`- Pricing keys: ${sectionKeys(flat, "marketing.pricing.").length}`);
lines.push(`- Contact keys: ${sectionKeys(flat, "marketing.contact.").length}`);
lines.push(`- FAQ keys: ${sectionKeys(flat, "marketing.faq.").length}`);
lines.push(`- What is keys: ${sectionKeys(flat, "marketing.whatIsPalettePlotting.").length}`);
lines.push(`- Quiz keys: ${sectionKeys(flat, "marketing.manifestationQuiz.").length}`);
lines.push(`- Total i18n keys: ${Object.keys(flat).length}`);
lines.push("");
lines.push(`Regenerate: \`node scripts/generate-website-english-copy-handoff.mjs\``);
lines.push("");

const out = lines.join("\n");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `WEBSITE-ENGLISH-COPY-${date}.md`);
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.length} chars, ${Object.keys(flat).length} i18n keys)`);
