/**
 * Rasterize public/favicon.svg → public/icon-196.png & public/icon-512.png (PWA + legacy tabs).
 * Run: node scripts/generate-favicon-pngs.mjs
 */
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "favicon.svg");

const svg = await readFile(svgPath);
await sharp(svg).resize(196, 196).png().toFile(join(root, "public", "icon-196.png"));
await sharp(svg).resize(512, 512).png().toFile(join(root, "public", "icon-512.png"));
console.log("Wrote public/icon-196.png and public/icon-512.png from favicon.svg");
