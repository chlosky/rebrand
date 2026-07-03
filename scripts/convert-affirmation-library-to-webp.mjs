/**
 * One-shot: PNG → WebP for public/affirmationimagelibrary (paths already use .webp in manifest).
 *
 * WebP is supported in Safari / WKWebView (iOS) and all target browsers for <img src="...">.
 *
 * Images also appear full-bleed (cover) in AffirmationViewer — layout is max-w-4xl (~896px).
 * After PNG→WebP, run `npm run reoptimize:affirmation-webp` to cap resolution (~2048px long edge)
 * so desktop/retina stays sharp without multi‑megapixel waste.
 *
 * Defaults: high-quality lossy (quality 95, alpha 100) — usually far smaller than PNG with
 * no visible change for these assets. Use --lossless for byte-identical decode vs PNG (often
 * smaller than PNG but may not hit 90%). Use --quality=N to tune (e.g. 88 for more savings).
 *
 * Usage:
 *   npm run convert:affirmation-webp
 *   npm run convert:affirmation-webp -- --delete-png
 *   npm run convert:affirmation-webp -- --lossless
 *   npm run convert:affirmation-webp -- --quality=92 --delete-png
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "public", "affirmationimagelibrary");

const args = new Set(process.argv.slice(2));
const deletePng = args.has("--delete-png");
const lossless = args.has("--lossless");
const qualityArg = [...args].find((a) => a.startsWith("--quality="));
const quality = qualityArg ? Math.min(100, Math.max(1, parseInt(qualityArg.split("=")[1], 10))) : 95;

async function* walkPngs(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkPngs(full);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".png")) {
      yield full;
    }
  }
}

function webpPath(pngPath) {
  return pngPath.slice(0, -4) + ".webp";
}

async function main() {
  const pngFiles = [];
  for await (const p of walkPngs(ROOT)) {
    pngFiles.push(p);
  }
  if (pngFiles.length === 0) {
    console.log("No PNG files under", ROOT, "(nothing to do).");
    return;
  }

  let bytesIn = 0;
  let bytesOut = 0;
  let converted = 0;

  for (const pngPath of pngFiles) {
    const outPath = webpPath(pngPath);
    const st = await fs.stat(pngPath);
    bytesIn += st.size;

    const input = sharp(pngPath, { failOn: "none" });
    /** @type {import('sharp').WebpOptions} */
    const opts = lossless
      ? { lossless: true, effort: 6 }
      : {
          quality,
          alphaQuality: 100,
          effort: 6,
          smartSubsample: true,
        };

    await input.webp(opts).toFile(outPath);
    const ost = await fs.stat(outPath);
    bytesOut += ost.size;
    converted += 1;

    if (deletePng) {
      await fs.unlink(pngPath);
    }
  }

  const mbIn = bytesIn / (1024 * 1024);
  const mbOut = bytesOut / (1024 * 1024);
  const ratio = bytesIn ? ((1 - bytesOut / bytesIn) * 100).toFixed(1) : "0";

  console.log(`Converted ${converted} files (${lossless ? "lossless WebP" : `lossy WebP quality=${quality}`}).`);
  console.log(`Input PNG total:  ${mbIn.toFixed(2)} MB`);
  console.log(`Output WebP total: ${mbOut.toFixed(2)} MB`);
  console.log(`Reduction: ~${ratio}%`);
  if (deletePng) console.log("Source PNGs removed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
