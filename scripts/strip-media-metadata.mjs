/**
 * Strip EXIF/XMP/IPTC and container metadata from site media under public/.
 * Images: sharp (re-encode without metadata). Videos: ffmpeg -map_metadata -1.
 *
 * Usage: npm run strip:metadata
 *        node scripts/strip-media-metadata.mjs [directory]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const targetDir = path.resolve(process.argv[2] ?? path.join(root, "public"));

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".avi", ".m4v"]);

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext)) out.push(full);
  }
  return out;
}

function ffmpegAvailable() {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return r.status === 0;
}

async function stripImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = `${filePath}.strip-tmp`;
  const input = sharp(filePath, { failOn: "none" }).rotate();
  if (ext === ".png") {
    await input.png({ compressionLevel: 9 }).toFile(tempPath);
  } else if (ext === ".webp") {
    await input.webp({ quality: 92 }).toFile(tempPath);
  } else if (ext === ".gif") {
    await input.gif().toFile(tempPath);
  } else {
    await input.jpeg({ quality: 92, mozjpeg: true }).toFile(tempPath);
  }
  await fs.rename(tempPath, filePath);
}

function stripVideo(filePath) {
  const tempPath = `${filePath}.strip-tmp${path.extname(filePath)}`;
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-i", filePath, "-map_metadata", "-1", "-c:v", "copy", "-c:a", "copy", tempPath],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr?.slice(-400) || "ffmpeg failed");
  }
  return fs.rename(tempPath, filePath);
}

const files = await walk(targetDir);
let ok = 0;
let skipped = 0;
let failed = 0;
const hasFfmpeg = ffmpegAvailable();

console.log(`Stripping metadata in ${targetDir} (${files.length} files)…`);

for (const filePath of files) {
  const ext = path.extname(filePath).toLowerCase();
  const rel = path.relative(root, filePath);
  try {
    if (IMAGE_EXT.has(ext)) {
      await stripImage(filePath);
      ok += 1;
      console.log(`  image  ${rel}`);
    } else if (VIDEO_EXT.has(ext)) {
      if (!hasFfmpeg) {
        skipped += 1;
        console.warn(`  skip   ${rel} (ffmpeg not found)`);
        continue;
      }
      await stripVideo(filePath);
      ok += 1;
      console.log(`  video  ${rel}`);
    }
  } catch (err) {
    failed += 1;
    console.error(`  FAIL   ${rel}: ${err instanceof Error ? err.message : err}`);
    await fs.unlink(`${filePath}.strip-tmp`).catch(() => {});
    await fs.unlink(`${filePath}.strip-tmp${ext}`).catch(() => {});
  }
}

console.log(`Done. ${ok} stripped, ${skipped} skipped, ${failed} failed.`);
