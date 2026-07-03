#!/usr/bin/env python3
"""Generate Android launcher PNGs from public/welcome-logo.png — not iOS app icon or splash wordmark."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/welcome-logo.png"
RES = ROOT / "android/app/src/main/res"

# Adaptive foreground layer = 108dp; key art must fit inside 66dp-diameter safe circle.
ADAPTIVE_FOREGROUND_DP = 108
SAFE_ZONE_DIAMETER_DP = 66

# Pastel sampled from welcome-logo tile (fallback if any alpha in legacy mipmaps).
LAUNCHER_BG = (183, 206, 195)  # #b7cec3

FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
LEGACY_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def load_logo() -> Image.Image:
    if not SOURCE.exists():
        raise SystemExit(f"Missing {SOURCE}")
    return Image.open(SOURCE).convert("RGBA")


def max_logo_side_px(canvas_size: int) -> int:
    """Square side (px) of the largest logo that fits inside the circular launcher mask."""
    return max(1, int(canvas_size / math.sqrt(2)))


def paste_logo(canvas: Image.Image, logo: Image.Image) -> None:
    max_side = max_logo_side_px(canvas.width)
    img = logo.copy()
    img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    x = (canvas.width - img.width) // 2
    y = (canvas.height - img.height) // 2
    if canvas.mode == "RGBA":
        canvas.paste(img, (x, y), img)
    else:
        canvas.paste(img, (x, y), img)


def save_foreground(logo: Image.Image, folder: str, size: int) -> None:
    out_dir = RES / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paste_logo(canvas, logo)
    out = out_dir / "ic_launcher_foreground.png"
    canvas.save(out, optimize=True)
    max_side = max_logo_side_px(size)
    print(f"Wrote {out} ({size}x{size}, logo max {max_side}px, safe-circle fit)")


def save_legacy(logo: Image.Image, folder: str, size: int) -> None:
    out_dir = RES / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    flat = Image.new("RGB", (size, size), LAUNCHER_BG)
    img = logo.copy()
    img.thumbnail((size, size), Image.Resampling.LANCZOS)
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    flat.paste(img, (x, y), img)
    for name in ("ic_launcher.png", "ic_launcher_round.png"):
        out = out_dir / name
        flat.save(out, optimize=True)
        print(f"Wrote {out} ({size}x{size} RGB, welcome-logo fill)")


def main() -> None:
    logo = load_logo()
    ref = max_logo_side_px(FOREGROUND_SIZES["mipmap-mdpi"])
    scale = ref / FOREGROUND_SIZES["mipmap-mdpi"]
    print(
        f"Safe-circle fit: max logo side {ref}px on {FOREGROUND_SIZES['mipmap-mdpi']}px "
        f"foreground (~{scale:.1%} of layer)"
    )
    for folder, size in FOREGROUND_SIZES.items():
        save_foreground(logo, folder, size)
    for folder, size in LEGACY_SIZES.items():
        save_legacy(logo, folder, size)


if __name__ == "__main__":
    main()
