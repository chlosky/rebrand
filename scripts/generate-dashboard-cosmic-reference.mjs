/**
 * Rasterize the dashboard cosmic background (WelcomeCosmicBackground) for external tools.
 * Run: node scripts/generate-dashboard-cosmic-reference.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "images");

const WELCOME_COSMIC_BASE = "#0a0812";

const WELCOME_STARS = Array.from({ length: 72 }, (_, i) => ({
  x: ((i * 41 + 13) % 98) + 1,
  y: ((i * 29 + 7) % 97) + 1.5,
  r: i % 4 === 0 ? 0.2 : i % 3 === 0 ? 0.14 : 0.1,
  o: i % 4 === 0 ? 0.5 : 0.28,
}));

function buildSvg(width, height) {
  const stars = WELCOME_STARS.map(
    (star, index) =>
      `<circle key="${index}" cx="${star.x}" cy="${star.y}" r="${star.r}" fill="#ffffff" opacity="${(star.o * 0.8).toFixed(3)}"/>`,
  ).join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <linearGradient id="cosmicBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${WELCOME_COSMIC_BASE}"/>
      <stop offset="50%" stop-color="#0f0d14"/>
      <stop offset="100%" stop-color="${WELCOME_COSMIC_BASE}"/>
    </linearGradient>
    <radialGradient id="nebulaTop" cx="50%" cy="-5%" rx="80%" ry="50%">
      <stop offset="0%" stop-color="rgba(88,62,110,0.35)"/>
      <stop offset="70%" stop-color="rgba(88,62,110,0)"/>
    </radialGradient>
    <radialGradient id="vignetteBottom" cx="50%" cy="100%" rx="100%" ry="60%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="50%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#cosmicBase)"/>
  <g opacity="1">
    ${stars}
  </g>
  <rect width="100" height="100" fill="url(#nebulaTop)"/>
  <rect width="100" height="100" fill="url(#vignetteBottom)"/>
</svg>`;
}

const exports = [
  { name: "dashboard-cosmic-reference-landscape", width: 1920, height: 1080 },
  { name: "dashboard-cosmic-reference-portrait", width: 1080, height: 1920 },
  { name: "dashboard-cosmic-reference-square", width: 1536, height: 1536 },
];

await mkdir(outDir, { recursive: true });

for (const { name, width, height } of exports) {
  const svg = buildSvg(width, height);
  const svgPath = join(outDir, `${name}.svg`);
  const pngPath = join(outDir, `${name}.png`);
  await writeFile(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg)).png().resize(width, height).toFile(pngPath);
  console.log(`Wrote ${svgPath}`);
  console.log(`Wrote ${pngPath} (${width}x${height})`);
}

console.log("\nUse the landscape PNG for Higgsfield (16:9). Portrait matches mobile dashboard.");
