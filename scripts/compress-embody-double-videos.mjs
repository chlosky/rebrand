/**
 * Recompress Your Double / embody practice MP4s using the same FFmpeg recipe as
 * `scripts/compress-hero-assets.mjs` (H.264, CRF 33, slow preset, yuv420p, faststart).
 *
 * - Keeps display resolution when width ≤ 1920; only scales down if wider.
 * - Strips audio tracks (`-an`).
 *
 * Targets:
 * - `public/videos/Connect.mp4` (single shared file), then copies the result to each
 *   `public/videos/{character}/Connect.mp4` so duplicate paths stay byte-identical.
 * - Per character (`boy-1`, `girl-1`, `girl-2`, `girl-3`): Fun, Work, Seen, Glam Up.
 *
 * Requires: `ffmpeg` on PATH.
 *
 * Usage: npm run compress:embody-double-videos
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const VIDEOS = path.join(ROOT, "public", "videos");

const CHARACTERS = ["boy-1", "girl-1", "girl-2", "girl-3"];
const PER_CHARACTER_FILES = ["Fun.mp4", "Work.mp4", "Seen.mp4", "Glam Up.mp4"];

function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Same x264 settings as `compress-hero-assets.mjs`.
 */
function reencodeToTmp(inputPath, tmpPath) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-an",
      "-vf",
      "scale=min(1920\\,iw):-2",
      "-c:v",
      "libx264",
      "-crf",
      "33",
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      tmpPath,
    ],
    { stdio: "inherit" },
  );
}

async function compressInPlace(absPath) {
  if (!(await fileExists(absPath))) {
    console.warn("Skip (missing):", path.relative(ROOT, absPath));
    return;
  }
  const before = (await fs.stat(absPath)).size;
  const tmp = `${absPath}.tmp-reencode.mp4`;
  try {
    reencodeToTmp(absPath, tmp);
    const mid = (await fs.stat(tmp)).size;
    await fs.unlink(absPath);
    await fs.rename(tmp, absPath);
    const saved = ((1 - mid / before) * 100).toFixed(1);
    console.log(
      `OK ${path.relative(ROOT, absPath)} — ${mb(before)} MB → ${mb(mid)} MB (~${saved}% smaller)`,
    );
  } catch (e) {
    try {
      await fs.unlink(tmp);
    } catch {
      /* ignore */
    }
    throw e;
  }
}

async function copyFile(src, dest) {
  await fs.copyFile(src, dest);
}

async function main() {
  const rootConnect = path.join(VIDEOS, "Connect.mp4");
  if (!(await fileExists(rootConnect))) {
    console.error("Missing:", rootConnect);
    process.exit(1);
  }

  console.log("Re-encoding shared Connect.mp4 …");
  await compressInPlace(rootConnect);

  for (const c of CHARACTERS) {
    const dest = path.join(VIDEOS, c, "Connect.mp4");
    if (await fileExists(dest)) {
      await copyFile(rootConnect, dest);
      console.log(`Synced Connect → ${path.relative(ROOT, dest)}`);
    }
  }

  for (const c of CHARACTERS) {
    for (const name of PER_CHARACTER_FILES) {
      const p = path.join(VIDEOS, c, name);
      await compressInPlace(p);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
