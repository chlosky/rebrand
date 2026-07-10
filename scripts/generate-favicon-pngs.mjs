/**
 * Rasterize favicon wordmark → public/icon-196.png & public/icon-512.png (PWA + browser tabs).
 * Run: npm run gen:favicons
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="92" fill="black">palette</text></svg>`;

for (const size of [196, 512]) {
  await sharp(Buffer.from(faviconSvg))
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(root, "public", `icon-${size}.png`));
}
console.log("Wrote public/icon-196.png and public/icon-512.png (palette)");
