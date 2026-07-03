import fs from "fs";
import path from "path";

const locales = ["en", "es-419", "pt-BR"];
const base = "src/i18n/locales";
const namespaces = [
  "common",
  "dashboard",
  "onboarding",
  "settings",
  "auth",
  "paywall",
  "tools",
  "support",
  "marketing",
];
const extras = {
  onboardingReadAffirmations: "onboarding.setup.readAffirmations",
  marketingManifestationQuiz: "marketing.manifestationQuiz",
  marketingWhatIs: "marketing.whatIsPalettePlotting",
};

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

function loadLocale(loc) {
  const flat = {};
  for (const ns of namespaces) {
    const p = path.join(base, loc, `${ns}.json`);
    if (fs.existsSync(p)) {
      walk(JSON.parse(fs.readFileSync(p, "utf8")), ns, flat);
    }
  }
  for (const [file, prefix] of Object.entries(extras)) {
    const p = path.join(base, loc, `${file}.json`);
    if (fs.existsSync(p)) {
      walk(JSON.parse(fs.readFileSync(p, "utf8")), prefix, flat);
    }
  }
  return flat;
}

const en = loadLocale("en");
const es = loadLocale("es-419");
const pt = loadLocale("pt-BR");
const keys = Object.keys(en).sort();

const esc = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\r/g, "");

let out = "";
out += "# Palette Plotting — Complete i18n handoff (EN + es-419 + pt-BR)\n\n";
out += "Generated: 2026-06-08. Micromanagement handoff for ChatGPT translation QA.\n\n";
out += "## Document map\n\n";
out += "1. **Section 1** — All " + keys.length + " i18n keys (every namespace).\n";
out += "2. **Section 2** — Onboarding read-aloud affirmations (12 categories × 10 lines).\n";
out += "3. **Section 3** — Premade affirmation sets (`tools.affirmations.premade.*`).\n";
out += "4. **Section 4** — Subliminal maker tour steps (`tools.subliminal.tour.*`).\n";
out += "5. **Section 5** — Copy still hardcoded in TypeScript.\n";
out += "6. **Section 6** — Namespace index (key counts).\n\n";

out += "---\n\n# Section 1 — All locale keys\n\n";
out += "| Key | English | es-419 | pt-BR |\n";
out += "|-----|---------|--------|-------|\n";
for (const k of keys) {
  out += `| \`${k}\` | ${esc(en[k])} | ${esc(es[k])} | ${esc(pt[k])} |\n`;
}

out += "\n---\n\n# Section 2 — Onboarding read-aloud affirmations\n\n";
out += "Keys: `onboarding.setup.readAffirmations.{CategoryName}` — AffirmationRead typewriter.\n\n";
const readAff = JSON.parse(
  fs.readFileSync(path.join(base, "en", "onboardingReadAffirmations.json"), "utf8"),
);
const readAffEs = JSON.parse(
  fs.readFileSync(path.join(base, "es-419", "onboardingReadAffirmations.json"), "utf8"),
);
const readAffPt = JSON.parse(
  fs.readFileSync(path.join(base, "pt-BR", "onboardingReadAffirmations.json"), "utf8"),
);
for (const cat of Object.keys(readAff)) {
  out += `## ${cat}\n\n`;
  for (let i = 0; i < readAff[cat].length; i++) {
    out += `${i + 1}. **EN:** ${readAff[cat][i]}\n`;
    out += `   **es-419:** ${readAffEs[cat]?.[i] ?? ""}\n`;
    out += `   **pt-BR:** ${readAffPt[cat]?.[i] ?? ""}\n\n`;
  }
}

out += "\n---\n\n# Section 3 — Premade affirmation sets\n\n";
const toolsEn = JSON.parse(fs.readFileSync(path.join(base, "en", "tools.json"), "utf8"));
const toolsEs = JSON.parse(fs.readFileSync(path.join(base, "es-419", "tools.json"), "utf8"));
const toolsPt = JSON.parse(fs.readFileSync(path.join(base, "pt-BR", "tools.json"), "utf8"));
const premade = toolsEn.affirmations?.premade || {};
for (const id of Object.keys(premade)) {
  out += `## ${id}\n\n`;
  out += `- **Name EN:** ${premade[id].name}\n`;
  out += `- **Name es-419:** ${toolsEs.affirmations?.premade?.[id]?.name ?? ""}\n`;
  out += `- **Name pt-BR:** ${toolsPt.affirmations?.premade?.[id]?.name ?? ""}\n\n`;
  const affEn = premade[id].affirmations || [];
  const affEs = toolsEs.affirmations?.premade?.[id]?.affirmations || [];
  const affPt = toolsPt.affirmations?.premade?.[id]?.affirmations || [];
  for (let i = 0; i < affEn.length; i++) {
    out += `${i + 1}. **EN:** ${affEn[i]}\n`;
    out += `   **es-419:** ${affEs[i] ?? ""}\n`;
    out += `   **pt-BR:** ${affPt[i] ?? ""}\n\n`;
  }
}

out += "\n---\n\n# Section 4 — Subliminal maker (all tools.subliminal.* + tools.demo.subliminal.*)\n\n";
const subliminalKeys = keys.filter(
  (k) => k.startsWith("tools.subliminal") || k.startsWith("tools.demo.subliminal"),
);
for (const k of subliminalKeys) {
  out += `### ${k}\n\n`;
  out += `- **EN:** ${en[k]}\n`;
  out += `- **es-419:** ${es[k]}\n`;
  out += `- **pt-BR:** ${pt[k]}\n\n`;
}

out += "\n---\n\n# Section 5 — Still hardcoded in source\n\n";
out += "## affirmations-data.ts SUPPORT_CATEGORIES fallback labels (only if tools.supportCategories key missing)\n\n";
const ad = fs.readFileSync("src/lib/affirmations-data.ts", "utf8");
for (const m of ad.matchAll(/label: "([^"]+)"/g)) {
  out += `- ${m[1]}\n`;
}

out += "\n## Guide.tsx character names (display only, English)\n\n";
out += "- River, Sage, Rose, Oliver\n";

out += "\n## Legal page bodies\n\n";
out += "- Terms, Privacy, EULA, Billing, DMCA, Acceptable Use — English HTML pages only\n";

out += "\n## Wired to i18n (no longer hardcoded)\n\n";
out += "- Routine item labels → `settings.routine.itemLabels.*` (ManifestationIntensity + ManifestationRoutineSettings)\n";
out += "- SMS verification → `settings.profile.smsVerificationMessage`\n";

out += "\n---\n\n# Section 6 — Namespace key counts\n\n";
const nsCounts = {};
for (const k of keys) {
  const ns = k.split(".")[0];
  nsCounts[ns] = (nsCounts[ns] || 0) + 1;
}
for (const [ns, count] of Object.entries(nsCounts).sort()) {
  out += `- ${ns}: ${count} keys\n`;
}

const outDir = "docs/locale-handoff";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "COMPLETE-COPY-HANDOFF-2026-06-08.md");
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.length} chars, ${keys.length} keys)`);
