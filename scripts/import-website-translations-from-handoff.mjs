import fs from "fs";
import path from "path";

const HANDOFF = process.argv[2] ?? path.join(
  process.cwd(),
  "uploads/website-translation-handoff.md",
);
const LOCALES_DIR = "src/i18n/locales";
const LOCALES = ["ar", "de", "zh-Hans", "nl", "fr", "it", "pt-BR", "es-419"];

const PRESERVE_FROM_EN = [
  /^marketing\.home\.featureStripKeys\.\d+$/,
  /^marketing\.home\.practiceSection\.pills\.\d+\.color$/,
];

function parseHandoff(md) {
  const localeFlat = Object.fromEntries(LOCALES.map((l) => [l, {}]));
  const community = Object.fromEntries(LOCALES.map((l) => [l, {}]));

  let currentLocale = null;
  let inCommunity = false;
  let currentCommunityField = null;
  let currentKey = null;
  let valueLines = [];

  const flushKey = () => {
    if (!currentLocale || !currentKey) return;
    const value = valueLines.join("\n").trim();
    if (value) localeFlat[currentLocale][currentKey] = value;
    currentKey = null;
    valueLines = [];
  };

  const flushCommunity = () => {
    if (!currentLocale || !currentCommunityField) return;
    const value = valueLines.join("\n").trim();
    if (value) community[currentLocale][currentCommunityField] = value;
    currentCommunityField = null;
    valueLines = [];
  };

  for (const rawLine of md.split(/\r?\n/)) {
    const line = rawLine;

    if (line.startsWith("# Community Page")) {
      flushKey();
      inCommunity = true;
      currentLocale = null;
      continue;
    }
    if (inCommunity && line.startsWith("# QA Note")) break;
    if (line.startsWith("# Legal Pages")) {
      flushKey();
      inCommunity = false;
      continue;
    }

    const localeMatch = line.match(/^# (ar|de|zh-Hans|nl|fr|it|pt-BR|es-419) —/);
    if (localeMatch) {
      flushKey();
      flushCommunity();
      inCommunity = false;
      currentLocale = localeMatch[1];
      continue;
    }

    if (inCommunity) {
      const commLocale = line.match(/^## (ar|de|zh-Hans|nl|fr|it|pt-BR|es-419)$/);
      if (commLocale) {
        flushCommunity();
        currentLocale = commLocale[1];
        continue;
      }
      const field = line.match(/^### (.+)$/);
      if (field && currentLocale) {
        flushCommunity();
        const label = field[1];
        if (label === "Community") currentCommunityField = "eyebrow";
        else if (label === "Join the community") currentCommunityField = "title";
        else if (label === "Body") currentCommunityField = "body";
        else if (label === "Official Palette Plotting Discord") currentCommunityField = "discordTitle";
        else if (label === "Official Palette Plotting TikTok") currentCommunityField = "tiktokTitle";
        else currentCommunityField = null;
        valueLines = [];
        continue;
      }
      if (currentCommunityField && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
        valueLines.push(line);
      }
      continue;
    }

    if (line.startsWith("## ") || line.startsWith("# ")) {
      flushKey();
      continue;
    }

    const keyMatch = line.match(/^### `(marketing\.[^`]+)`$/);
    if (keyMatch && currentLocale) {
      flushKey();
      currentKey = keyMatch[1];
      valueLines = [];
      continue;
    }

    if (currentKey) {
      if (line.trim() === "---") {
        flushKey();
        continue;
      }
      if (line.startsWith("### `") || line.startsWith("## ") || line.startsWith("# ")) {
        flushKey();
        const retry = line.match(/^### `(marketing\.[^`]+)`$/);
        if (retry && currentLocale) {
          currentKey = retry[1];
          valueLines = [];
        }
        continue;
      }
      valueLines.push(line);
    }
  }
  flushKey();
  flushCommunity();

  return { localeFlat, community };
}

function unflattenKeys(flat) {
  const root = {};
  for (const [fullKey, value] of Object.entries(flat)) {
    const parts = fullKey.replace(/^marketing\./, "").split(".");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        if (/^\d+$/.test(part)) current[Number(part)] = value;
        else current[part] = value;
        break;
      }
      const next = parts[i + 1];
      if (/^\d+$/.test(next)) {
        const idx = Number(next);
        if (!current[part]) current[part] = [];
        const afterNext = parts[i + 2];
        if (!current[part][idx]) {
          current[part][idx] = afterNext !== undefined && /^\d+$/.test(afterNext) ? [] : {};
        }
        current = current[part][idx];
        i++;
      } else {
        if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return root;
}

function walkFlat(obj, prefix, flat) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === "object") walkFlat(item, `${key}.${i}`, flat);
        else flat[`${key}.${i}`] = item;
      });
    } else if (v && typeof v === "object") {
      walkFlat(v, key, flat);
    } else {
      flat[key] = v;
    }
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const md = fs.readFileSync(HANDOFF, "utf8");
const { localeFlat, community } = parseHandoff(md);

const enMarketing = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en/marketing.json"), "utf8"));
const enFlat = {};
walkFlat(enMarketing, "marketing", enFlat);

if (!enMarketing.community) {
  enMarketing.community = {
    eyebrow: "Community",
    title: "Join the community",
    body: "Connect with Palette Plotting on Discord and TikTok — updates, manifestation talk, and what we're building next.",
    discordTitle: "Official Palette Plotting Discord",
    tiktokTitle: "Official Palette Plotting TikTok",
  };
  writeJson(path.join(LOCALES_DIR, "en/marketing.json"), enMarketing);
}

for (const locale of LOCALES) {
  const flat = { ...localeFlat[locale] };

  for (const pattern of PRESERVE_FROM_EN) {
    for (const [key, enVal] of Object.entries(enFlat)) {
      if (pattern.test(key) && enVal !== undefined) flat[key] = enVal;
    }
  }

  const all = unflattenKeys(flat);
  const marketing = {
    pricing: all.pricing ?? {},
    contact: all.contact ?? {},
    faq: all.faq ?? {},
    home: all.home ?? {},
    community: community[locale] ?? {},
  };
  const quiz = all.manifestationQuiz ?? {};
  const whatIs = all.whatIsPalettePlotting ?? {};

  const dir = path.join(LOCALES_DIR, locale);
  writeJson(path.join(dir, "marketing.json"), marketing);
  writeJson(path.join(dir, "marketingManifestationQuiz.json"), quiz);
  writeJson(path.join(dir, "marketingWhatIs.json"), whatIs);

  console.log(
    `Wrote ${locale}: marketing(${Object.keys(flat).filter((k) => !k.includes("manifestationQuiz") && !k.includes("whatIsPalettePlotting")).length} keys), quiz(${Object.keys(quiz).length} top), whatIs(${Object.keys(whatIs).length} top)`,
  );
}

console.log("Done.");
