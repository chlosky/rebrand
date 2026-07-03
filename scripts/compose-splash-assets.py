#!/usr/bin/env python3
"""Build bulletproof Android splash assets: opaque flat PNG + vector wordmark (no alpha)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORDMARK = ROOT / "android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_wordmark.png"
OUT_FLAT = ROOT / "android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_flat.png"
OUT_ICON_FLAT = ROOT / "android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_icon_flat.png"
OUT_VECTOR = ROOT / "android/app/src/main/res/drawable/ic_paletteplotting_splash_wordmark_vector.xml"

BG = (10, 8, 18)  # #0a0812
CANVAS = 1024
ICON_CANVAS = 432  # ~288dp @ xxhdpi for Android 12 splash icon slot
VIEWPORT_W = 240
VIEWPORT_H = 72
ALPHA_THRESHOLD = 48


def load_wordmark_rgba() -> Image.Image:
    if not WORDMARK.exists():
        raise SystemExit(f"Missing wordmark: {WORDMARK}")
    return Image.open(WORDMARK).convert("RGBA")


def compose_flat(canvas_size: int) -> Image.Image:
    src = load_wordmark_rgba()
    flat = Image.new("RGB", (canvas_size, canvas_size), BG)
    flat.paste(src, ((canvas_size - src.width) // 2, (canvas_size - src.height) // 2), src)
    return flat


def mask_from_wordmark(im: Image.Image, threshold: int = ALPHA_THRESHOLD) -> list[list[bool]]:
    px = im.load()
    w, h = im.size
    return [[px[x, y][3] >= threshold for x in range(w)] for y in range(h)]


def bbox(mask: list[list[bool]]) -> tuple[int, int, int, int] | None:
    h = len(mask)
    w = len(mask[0]) if h else 0
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < 0:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def mask_to_path_data(mask: list[list[bool]], box: tuple[int, int, int, int]) -> str:
    x0, y0, x1, y1 = box
    crop_h = y1 - y0
    crop_w = x1 - x0
    sx = VIEWPORT_W / max(crop_w, 1)
    sy = VIEWPORT_H / max(crop_h, 1)
    parts: list[str] = []

    for y in range(y0, y1):
        row = mask[y]
        x = x0
        while x < x1:
            if not row[x]:
                x += 1
                continue
            run_start = x
            while x < x1 and row[x]:
                x += 1
            run_end = x
            lx = (run_start - x0) * sx
            rx = (run_end - x0) * sx
            ty = (y - y0) * sy
            by = (y + 1 - y0) * sy
            parts.append(f"M{lx:.2f},{ty:.2f}H{rx:.2f}V{by:.2f}H{lx:.2f}Z")

    return "".join(parts)


def write_vector_xml(path_data: str) -> None:
    xml = f'''<?xml version="1.0" encoding="utf-8"?>
<!-- Auto-generated wordmark vector — no PNG, no bitmap, no alpha. Regenerate: python scripts/compose-splash-assets.py -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="{VIEWPORT_W}dp"
    android:height="{VIEWPORT_H}dp"
    android:viewportWidth="{VIEWPORT_W}"
    android:viewportHeight="{VIEWPORT_H}">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="{path_data}" />
</vector>
'''
    OUT_VECTOR.parent.mkdir(parents=True, exist_ok=True)
    OUT_VECTOR.write_text(xml, encoding="utf-8")
    print(f"Wrote {OUT_VECTOR} ({len(path_data)} path chars)")


def main() -> None:
    src = load_wordmark_rgba()
    mask = mask_from_wordmark(src)
    box = bbox(mask)
    if not box:
        raise SystemExit("No visible wordmark pixels to trace")

    flat = compose_flat(CANVAS)
    OUT_FLAT.parent.mkdir(parents=True, exist_ok=True)
    flat.save(OUT_FLAT, optimize=True)
    print(f"Wrote {OUT_FLAT} ({CANVAS}x{CANVAS} RGB opaque)")

    icon_flat = compose_flat(ICON_CANVAS)
    icon_flat.save(OUT_ICON_FLAT, optimize=True)
    print(f"Wrote {OUT_ICON_FLAT} ({ICON_CANVAS}x{ICON_CANVAS} RGB opaque)")

    path_data = mask_to_path_data(mask, box)
    if len(path_data) > 900_000:
        raise SystemExit(f"Vector path too large ({len(path_data)} chars) — simplify source")
    write_vector_xml(path_data)


if __name__ == "__main__":
    main()
