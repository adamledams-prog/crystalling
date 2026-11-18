"""Génère vignettes pixel + spritesheets d'animation (rebond)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "images" / "persos"
CELL = 96
PIXELS = 52
FRAMES = 8
PALETTE = 28

# (dx, dy) par frame — petit rebond style jeu pixel
OFFSETS = [
    (0, 0),
    (0, -6),
    (0, -10),
    (0, -5),
    (3, 0),
    (0, 4),
    (-3, 0),
    (0, 0),
]

PAIRS = [
    ("solaris-vaalor.png", "solaris-vaalor"),
    ("reginald-roi.png", "reginald-roi"),
]


def fit_square(im: Image.Image, size: int) -> Image.Image:
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = max(w, h)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2), im)
    small = sq.resize((PIXELS, PIXELS), Image.Resampling.LANCZOS)
    alpha = small.split()[3]
    rgb = small.convert("RGB")
    q = rgb.quantize(colors=PALETTE, method=Image.Quantize.MEDIANCUT)
    px = q.convert("RGBA")
    px.putalpha(alpha)
    return px.resize((size, size), Image.Resampling.NEAREST)


def build_sheet(base: Image.Image) -> tuple[Image.Image, Image.Image]:
    frames: list[Image.Image] = []
    for dx, dy in OFFSETS:
        frame = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        ox = (CELL - base.width) // 2 + dx
        oy = (CELL - base.height) // 2 + dy
        frame.paste(base, (ox, oy), base)
        frames.append(frame)

    sheet = Image.new("RGBA", (CELL * FRAMES, CELL), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * CELL, 0), fr)
    return frames[0], sheet


def main() -> None:
    for filename, slug in PAIRS:
        src = ROOT / filename
        if not src.exists():
            print("skip", src)
            continue
        base = fit_square(Image.open(src), CELL)
        thumb, sheet = build_sheet(base)
        thumb.save(ROOT / f"{slug}-pixel.png")
        sheet.save(ROOT / f"{slug}-sheet.png")
        print("ok", slug)


if __name__ == "__main__":
    main()