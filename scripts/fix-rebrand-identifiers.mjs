#!/usr/bin/env node
/** Fix identifier breaks from naive "Palette Plotting" replacement */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const FIXES = [
  ["whatIsPalettePlotting", "whatIsPalettePlotting"],
  ["WhatIsPalettePlotting", "WhatIsPalettePlotting"],
  ["campaignWelcomePathFromPalettePlottingUrl", "campaignWelcomePathFromPalettePlottingUrl"],
  ["PalettePlottingLogoV1.png", "PalettePlottingLogoV1.png"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "dist") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (!/\.(png|jpg|jpeg|webp|gif|ico|woff|mp4|mp3)$/i.test(ent.name)) files.push(full);
  }
  return files;
}

let n = 0;
for (const file of walk(ROOT)) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;
  for (const [from, to] of FIXES) text = text.split(from).join(to);
  if (text !== before) {
    fs.writeFileSync(file, text);
    n++;
  }
}
console.log(`Fixed ${n} files`);
