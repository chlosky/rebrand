/**
 * Re-encode existing affirmation library WebPs for smaller files without looking soft in the
 * Affirmation Visualizer (AffirmationViewer.tsx): hero card is inside max-w-4xl (~896px) with
 * background-size: cover. Capping the long edge at 2048px keeps enough pixels for 2× displays
 * (~1792px needed) without shipping multi‑megapixel sources that only ever scale down.
 *
 * Format stays WebP (Safari / WKWebView / Chrome).
 *
 * Defaults (~15 MB for 52 images): --max-long-edge=2048 --quality=90 — aligned with
 * AffirmationViewer card width (~896px) at 2× DPR without upscaling blur.
 *
 * Tighter (~8 MB, verify in viewer): --max-long-edge=1920 --quality=85
 *
 * Usage:
 *   npm run reoptimize:affirmation-webp
 *   npm run reoptimize:affirmation-webp -- --max-long-edge=2400 --quality=92
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "public", "affirmationimagelibrary");

const args = process.argv.slice(2);
const maxEdgeArg = args.find((a) => a.startsWith("--max-long-edge="));
const qualityArg = args.find((a) => a.startsWith("--quality="));
const maxLongEdge = maxEdgeArg
  ? Math.max(512, parseInt(maxEdgeArg.split("=")[1], 10) || 2048)
  : 2048;
const quality = qualityArg
  ? Math.min(100, Math.max(1, parseInt(qualityArg.split("=")[1], 10) || 90))
  : 90;

async function* walkWebps(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkWebps(full);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".webp")) {
      yield full;
    }
  }
}

async function main() {
  const files = [];
  for await (const p of walkWebps(ROOT)) {
    files.push(p);
  }
  if (files.length === 0) {
    console.log("No .webp files under", ROOT);
    return;
  }

  let bytesIn = 0;
  let bytesOut = 0;

  for (const filePath of files) {
    const st = await fs.stat(filePath);
    bytesIn += st.size;

    const buf = await fs.readFile(filePath);
    const img = sharp(buf, { failOn: "none" });
    const meta = await img.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const longEdge = Math.max(w, h);

    let pipeline = img;
    if (longEdge > maxLongEdge) {
      pipeline = pipeline.resize({
        width: w >= h ? maxLongEdge : undefined,
        height: h > w ? maxLongEdge : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const tmp = filePath + ".tmp.webp";
    await pipeline
      .webp({
        quality,
        alphaQuality: 100,
        effort: 6,
        smartSubsample: true,
      })
      .toFile(tmp);
    await fs.rename(tmp, filePath);

    bytesOut += (await fs.stat(filePath)).size;
  }

  console.log(
    `Re-encoded ${files.length} files (max long edge ${maxLongEdge}px, WebP quality ${quality}).`
  );
  console.log(`Before: ${(bytesIn / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`After:  ${(bytesOut / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Saved:  ~${((1 - bytesOut / bytesIn) * 100).toFixed(1)}%`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
