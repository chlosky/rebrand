#!/usr/bin/env node
/**
 * One-shot rebrand: Palette Plotting / Palette Plotting → Palette Plotting
 * Run: node scripts/rebrand-to-palette-plotting.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vite",
  "android/.gradle",
  "ios/App/Pods",
]);

const SKIP_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".mp4", ".mp3", ".wav", ".zip", ".pdf"]);

/** Order matters — longer / more specific first */
const REPLACEMENTS = [
  ["support@paletteplot.com", "support@paletteplot.com"],
  ["Palette Plotting Pro", "Palette Plotting Pro"],
  ["Palette Plotting LLC", "Palette Plotting LLC"],
  ["com.paletteplotting.app", "com.paletteplotting.app"],
  ["com.paletteplotting.app", "com.paletteplotting.app"],
  ["what-is-palette-plotting", "what-is-palette-plotting"],
  ["what-is-palette-plotting", "what-is-palette-plotting"],
  ["palette-plotting-app", "palette-plotting-app"],
  ["palette-plotting-testimonials-marquee-slow", "palette-plotting-testimonials-marquee-slow"],
  ["palette-plotting-testimonials-marquee", "palette-plotting-testimonials-marquee"],
  ["paletteplotting://", "paletteplotting://"],
  ["paletteplotting:", "paletteplotting:"],
  ["https://paletteplot.com", "https://paletteplot.com"],
  ["https://paletteplot.com", "https://paletteplot.com"],
  ["paletteplot.com", "paletteplot.com"],
  ["paletteplot.com", "paletteplot.com"],
  ["paletteplot.com", "paletteplot.com"],
  ["@paletteplotting", "@paletteplotting"],
  ["@paletteplotting", "@paletteplotting"],
  ["PALETTE_PLOTTING_", "PALETTE_PLOTTING_"],
  ["Palette Plotting", "Palette Plotting"],
  ["PALETTE PLOTTING", "PALETTE PLOTTING"],
  ["Palette Plotting", "Palette Plotting"],
  ["PALETTE PLOTTING", "PALETTE PLOTTING"],
  ["palette-plotting", "palette-plotting"],
  ["paletteplotting", "paletteplotting"],
  ["PalettePlotting", "PalettePlotting"],
  ["PALETTE_PLOTTING", "PALETTE_PLOTTING"],
  ["paletteplotting", "paletteplotting"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name) || SKIP_DIRS.has(rel)) continue;
      walk(full, files);
    } else {
      const ext = path.extname(ent.name).toLowerCase();
      if (SKIP_EXT.has(ext)) continue;
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel === "scripts/rebrand-to-palette-plotting.mjs") continue;

  let text = fs.readFileSync(file, "utf8");
  const before = text;
  for (const [from, to] of REPLACEMENTS) {
    text = text.split(from).join(to);
  }
  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    changed++;
    console.log("updated:", rel);
  }
}

console.log(`\nDone. ${changed} files updated.`);
