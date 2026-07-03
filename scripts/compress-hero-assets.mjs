/**
 * Recompress landing hero assets (see src/components/Hero.tsx).
 *
 * - PNG fallback → WebP (quality 92, alpha 100): ~90% smaller, visually unchanged on hero.
 * - MP4 → H.264, max width 1920, CRF 33, slow preset, yuv420p, faststart, audio stripped (muted hero).
 *
 * Requires: Node, `sharp`, and `ffmpeg` on PATH.
 *
 * Usage: npm run compress:hero
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PNG = path.join(ROOT, "public", "base-background-1.png");
const WEBP = path.join(ROOT, "public", "base-background-1.webp");
const MP4 = path.join(ROOT, "public", "videos", "base-background-1-video.mp4");
const MP4_TMP = path.join(ROOT, "public", "videos", "base-background-1-video.tmp.mp4");

function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

async function main() {
  const beforePng = await fs.stat(PNG).catch(() => null);
  const beforeMp4 = await fs.stat(MP4).catch(() => null);
  if (!beforeMp4) {
    console.error("Missing:", MP4);
    process.exit(1);
  }

  if (beforePng) {
    await sharp(PNG, { failOn: "none" })
      .webp({
        quality: 92,
        alphaQuality: 100,
        effort: 6,
        smartSubsample: true,
      })
      .toFile(WEBP);
    const afterWebp = (await fs.stat(WEBP)).size;
    console.log(`PNG ${mb(beforePng.size)} MB → WebP ${mb(afterWebp)} MB (~${((1 - afterWebp / beforePng.size) * 100).toFixed(1)}% smaller)`);
  } else {
    console.log("Skip WebP (no PNG at", PNG, ") — keeping existing", WEBP);
  }

  const mp4Size = beforeMp4.size;
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      MP4,
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
      MP4_TMP,
    ],
    { stdio: "inherit" }
  );
  const afterMp4 = (await fs.stat(MP4_TMP)).size;
  await fs.rename(MP4_TMP, MP4);
  console.log(`MP4 ${mb(mp4Size)} MB → ${mb(afterMp4)} MB (~${((1 - afterMp4 / mp4Size) * 100).toFixed(1)}% smaller)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
