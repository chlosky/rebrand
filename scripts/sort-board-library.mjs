import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "public", "boardimagelibrary");
const staging = path.join(root, "_staging");
const themes = [
  ["career-money", "Career & Money"],
  ["love-relationships", "Love & Relationships"],
  ["home-space", "Home & Space"],
  ["beauty-wellness", "Beauty & Wellness"],
  ["travel-adventure", "Travel & Adventure"],
  ["organization-plan", "Organization & Plan"],
  ["aesthetic-mood", "Aesthetic & Mood"],
  ["identity", "Self & Direction"],
  ["found-objects", "Found Objects"],
  ["affixements", "Affixements"],
];

const rules = [
  [/travel|suitcase|airplane|trail-sign|campfire|eiffel|passport|footprints|camper-van|hiking-backpack|luggage-tag|snorkel|sahara|snowy-pine|fjord|hot-air|train-track|tropical-beach|castle|car-dashboard|alpine-trail|packed-suitcase|norwegian|scottish|desert-highway|boat-deck|beach-sand|airplane-wing|signpost|sand-dunes|wing-sunset|luggage-tags|snorkel-mask|postcards|van-desert|backpack-valley|footprints-beach|passport-stamps|hot-air-balloon|train-tracks|tropical-palm|milky-way-starry-mountains/i, "travel-adventure"],
  [/love|heart-stones|heart-sand|wedding|swans|hand|roses|picnic|padlock|chocolate|bouquet|umbrella|moon-reflection|adirondack|letter-wax|two-chairs|two-mugs|two-coffee|interlaced|sealed-love|twin-candle|bridge.*sunset|ceramic-heart/i, "love-relationships"],
  [/career|money|coins|briefcase|skyscraper|piggy|calculator|blueprint|trophy|wallet|stock-market|conference-room|bar-graph|espresso-leather|corner-office|office-chair|contract|minimalist-desk|laptop-notebook/i, "career-money"],
  [/home|living-room|fireplace|kitchen-herb|made-bed|reading-nook|spa-bathroom|front-door|patio|laundry|bookshelf|dining-table|houseplants|scandinavian|throw-pillow|garage-tool|nursery|home-office|porch|thermostat|window-seat|blanket|entryway|cozy-living|folded-laundry|organized-bookshelf|organized-garage|keys-entryway|keys-hanging/i, "home-space"],
  [/beauty|wellness|spa-|yoga|essential-oil|skincare|smoothie|bath-salt|running-shoes|meditation|soap|eucalyptus|pilates|sunscreen|herbal-tea|crystal|nail-polish|hairbrush|dumbbell|salad|sleep-mask|zen-garden|beauty-wellness/i, "beauty-wellness"],
  [/organization|plan|bullet-journal|wall-calendar|file-folder|kanban|planner|analog-clock|label-maker|filing-cabinet|clipboard|timeline|pomodoro|desk-organizer|meal-prep|goal-worksheet|index-card|tablet-calendar|mason-jar|garage-bin|morning-routine|project-roadmap|kanban-board/i, "organization-plan"],
  [/aesthetic|mood|gradient-cloud|rain-droplet|wheat-field|white-architecture|neon-city|hygge|film-grain|cherry-blossom|dark-academia|cottagecore|vaporwave|foggy-forest|marble-gold|sage-green|autumn-maple|milky-way|zen-stacked|vinyl-record|fairy-light|desert-sand|soft-pink|bokeh|gradient|linen-fabric|starry|maple-leaves/i, "aesthetic-mood"],
  [/identity|journal-desk|compass|hiking-boot|origami|graduation|open-door|butterfly|artist-palette|mountain-summit|mountain-sunrise|seedling|lighthouse|chess|fingerprint|chameleon|name-badge|constellation|mirror-sunlit|mug-steam|path-splitting|phoenix|quill|journal|cranes|summit|splitting|badge-cork|feather/i, "identity"],
];

function themeFor(name) {
  for (const [re, slug] of rules) {
    if (re.test(name)) return slug;
  }
  return null;
}

function slugify(s) {
  return s.replace(/\.png$/i, "").replace(/^c__.*$/i, "").replace(/^\d+-?/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48) || "image";
}

const skip = /^(c__Users|hero-|icon-|welcome-|app-four|life-rebrand|home-org|moodboard|office-cover|\d+\.png$)/i;
fs.mkdirSync(staging, { recursive: true });

for (const [slug] of themes) {
  fs.mkdirSync(path.join(root, slug), { recursive: true });
}

const all = [];
const scanDirs = [];
for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  scanDirs.push({ name: dir.name, path: path.join(root, dir.name) });
}
for (const { name: folderName, path: folder } of scanDirs) {
  if (folderName.startsWith("_")) continue;
  for (const f of fs.readdirSync(folder)) {
    if (!f.toLowerCase().endsWith(".png")) continue;
    const from = path.join(folder, f);
    const staged = path.join(staging, `${folderName}__${f}`);
    if (!fs.existsSync(staged)) fs.copyFileSync(from, staged);
    all.push({ staged, name: f, folder: folderName });
  }
}
const stagingDir = path.join(root, "_staging");
if (fs.existsSync(stagingDir)) {
  for (const f of fs.readdirSync(stagingDir)) {
    if (!f.toLowerCase().endsWith(".png")) continue;
    all.push({ staged: path.join(stagingDir, f), name: f.includes("__") ? f.split("__").slice(1).join("__") : f, folder: "staging" });
  }
}

const buckets = Object.fromEntries(themes.map(([s]) => [s, []]));
for (const file of all) {
  if (skip.test(file.name)) continue;
  const slug = themeFor(file.name) ?? themeFor(file.name.replace(/^\d+-/, ""));
  if (!slug || !buckets[slug]) continue;
  buckets[slug].push(file);
}

for (const slug of themes.map(([s]) => s)) {
  const dest = path.join(root, slug);
  if (slug === "found-objects" || slug === "affixements") continue;
  for (const f of fs.readdirSync(dest)) {
    if (f.endsWith(".png")) fs.unlinkSync(path.join(dest, f));
  }
  const seen = new Set();
  const picked = [];
  for (const file of buckets[slug]) {
    const base = slugify(file.name);
    if (seen.has(base)) continue;
    seen.add(base);
    picked.push({ ...file, base });
    if (picked.length >= 20) break;
  }
  picked.forEach((file, i) => {
    const num = String(i + 1).padStart(2, "0");
    const out = `${num}-${file.base}.png`;
    fs.copyFileSync(file.staged, path.join(dest, out));
  });
}

const images = [];
for (const [slug, theme] of themes) {
  const dir = path.join(root, slug);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".png")).sort()) {
    const desc = f.replace(/^\d+-/, "").replace(/\.png$/i, "").replace(/-/g, " ");
    images.push({
      id: `${slug}-${f.replace(/\.png$/i, "")}`,
      theme,
      category: theme,
      url: `/boardimagelibrary/${slug}/${f}`,
      description: desc.charAt(0).toUpperCase() + desc.slice(1),
      tags: [slug],
    });
  }
}

const manifestPath = path.join(root, "manifest.json");
const manifestBody = JSON.stringify({ version: 2, themes: themes.map(([, t]) => t), images }, null, 2);
try {
  fs.writeFileSync(manifestPath, manifestBody);
} catch {
  fs.writeFileSync(path.join(root, "manifest.generated.json"), manifestBody);
  console.error("Wrote manifest.generated.json (manifest.json locked)");
}

if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.rmSync(staging, { recursive: true, force: true });

console.log(
  themes.map(([s, t]) => `${t}: ${fs.readdirSync(path.join(root, s)).filter((x) => x.endsWith(".png")).length}`).join("\n"),
);
