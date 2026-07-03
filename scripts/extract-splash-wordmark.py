#!/usr/bin/env python3
"""Build true-transparent Android splash wordmark from public/welcome-logo.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "welcome-logo.png"
OUT = ROOT / "android" / "app" / "src" / "main" / "res" / "drawable-nodpi" / "ic_paletteplotting_splash_wordmark.png"
CANVAS = 1024
PADDING_RATIO = 0.18


def is_wordmark_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 16:
        return False
    return max(r, g, b) <= 45


def main() -> None:
    src = Image.open(SOURCE).convert("RGBA")
    w, h = src.size
    px = src.load()

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_wordmark_pixel(r, g, b, a):
                # White wordmark on true transparency for #0a0812 splash background
                opx[x, y] = (255, 255, 255, a)

    bbox = out.getbbox()
    if not bbox:
        raise SystemExit("No wordmark pixels found in welcome-logo.png")

    cropped = out.crop(bbox)
    cw, ch = cropped.size
    side = max(cw, ch)
    pad = int(side * PADDING_RATIO)
    canvas_side = side + pad * 2

    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    ox = (canvas_side - cw) // 2
    oy = (canvas_side - ch) // 2
    canvas.paste(cropped, (ox, oy), cropped)

    if canvas_side != CANVAS:
        canvas = canvas.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, optimize=True)

    data = list(canvas.getdata())
    total = len(data)
    trans = sum(1 for *_, a in data if a < 16)
    visible = total - trans
    print(f"Wrote {OUT} ({CANVAS}x{CANVAS})")
    print(f" transparent={trans/total:.1%} visible_pixels={visible}")
    print("Run: python scripts/compose-splash-assets.py")


if __name__ == "__main__":
    main()
