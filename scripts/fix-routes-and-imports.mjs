#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPLACEMENTS = [
  ["@/lib/marketingSitePaths", "@/lib/siteRoutes"],
  ["from \"./PathLoading\"", "from \"./PlotLoading\""],
  ["from \"./PathSynthesis\"", "from \"./PlotSynthesis\""],
  ["SetupPathLoading", "SetupPlotLoading"],
  ["SetupPathSynthesis", "SetupPlotSynthesis"],
  ["/path-loading", "/plot-loading"],
  ["/path-synthesis", "/plot-synthesis"],
  ["path-loading", "plot-loading"],
  ["path-synthesis", "plot-synthesis"],
  ["setup.pathLoading", "setup.plotLoading"],
  ["setup.pathSynthesis", "setup.plotSynthesis"],
  ["\"pathLoading\"", "\"plotLoading\""],
  ["\"pathSynthesis\"", "\"plotSynthesis\""],
  ["package com.paletteplotting.app;", "package com.paletteplotting.app;"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist"].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (!/\.(png|jpg|jpeg|webp|gif|ico|woff|mp4|mp3|pdf)$/i.test(ent.name)) files.push(full);
  }
  return files;
}

let n = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel.startsWith("scripts\\fix-") || rel.startsWith("scripts/fix-")) continue;
  let text = fs.readFileSync(file, "utf8");
  const before = text;
  for (const [from, to] of REPLACEMENTS) text = text.split(from).join(to);
  if (text !== before) {
    fs.writeFileSync(file, text);
    n++;
  }
}
console.log(`Route/import updates: ${n} files`);
