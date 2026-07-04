/**
 * Rasterize public/logo.png → public/icon-196.png & public/icon-512.png (PWA + browser tabs).
 * Run: npm run gen:favicons
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourcePath = join(root, "public", "logo.png");

for (const size of [196, 512]) {
  await sharp(sourcePath)
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(root, "public", `icon-${size}.png`));
}
console.log("Wrote public/icon-196.png and public/icon-512.png from logo.png");
