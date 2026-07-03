import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath =
  process.argv[2] ||
  path.join(process.env.USERPROFILE || "", "Downloads/paletteplotting_layout_preservation_diff.csv");
const localesRoot = path.join(__dirname, "../../src/i18n/locales");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.length)) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function setByKeyPath(root, keyPath, value) {
  const segments = keyPath.split(" > ");
  let cur = root;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    const lineMatch = seg.match(/^(.+?) \(line (\d+)\)$/);
    if (lineMatch) {
      const key = lineMatch[1];
      const idx = Number(lineMatch[2]) - 1;
      if (isLast) cur[key][idx] = value;
      else cur = cur[key][idx];
    } else if (isLast) {
      cur[seg] = value;
    } else {
      cur = cur[seg];
    }
  }
}

const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
rows.shift();
let appliedPt = 0;
let appliedEs = 0;
const errors = [];
const loaded = new Map();

function loadLocaleFile(namespace, locale) {
  const cacheKey = `${locale}/${namespace}`;
  if (!loaded.has(cacheKey)) {
    const filePath = path.join(localesRoot, locale, `${namespace}.json`);
    loaded.set(cacheKey, {
      filePath,
      data: JSON.parse(fs.readFileSync(filePath, "utf8")),
    });
  }
  return loaded.get(cacheKey);
}

for (const row of rows) {
  if (row.length < 10) continue;
  const [namespace, key, , , newPt, , , , , newEs] = row;
  for (const [locale, newVal] of [
    ["pt-BR", newPt],
    ["es-419", newEs],
  ]) {
    try {
      const entry = loadLocaleFile(namespace, locale);
      setByKeyPath(entry.data, key, newVal);
      locale === "pt-BR" ? appliedPt++ : appliedEs++;
    } catch (e) {
      errors.push({ namespace, key, locale, error: e.message });
    }
  }
}

for (const { filePath, data } of loaded.values()) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

console.log("CSV:", csvPath);
console.log("Applied pt-BR:", appliedPt);
console.log("Applied es-419:", appliedEs);
if (errors.length) {
  console.error("Errors:", errors.length);
  errors.forEach((e) => console.error(e));
  process.exit(1);
}
