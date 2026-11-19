"""Découpe perso : rembg + masque texte (panneau Brawl). Usage:
  python prepare_perso.py chemin/image.png slug
"""
from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import remove

ROOT = (
    Path(__file__).resolve().parents[1]
    / "frontend"
    / "public"
    / "images"
    / "persos"
)


def prepare(src: Path, dest: Path, *, panel_ratio: float = 0.56) -> None:
    base = Image.open(src).convert("RGBA")
    w, h = base.size
    panel = base.crop((0, 0, int(w * panel_ratio), h))
    buf = BytesIO()
    panel.save(buf, format="PNG")
    cut = remove(buf.getvalue())
    im = Image.open(BytesIO(cut)).convert("RGBA")
    arr = np.array(im)
    ph, pw = arr.shape[:2]
    arr[: int(ph * 0.11), :, 3] = 0
    arr[int(ph * 0.74) :, :, 3] = 0
    arr[int(ph * 0.68) :, : int(pw * 0.26), 3] = 0
    im = Image.fromarray(arr)
    bbox = im.getbbox()
    if bbox:
        pad = 6
        im = im.crop(
            (
                max(0, bbox[0] - pad),
                max(0, bbox[1] - pad),
                min(pw, bbox[2] + pad),
                min(ph, bbox[3] + pad),
            )
        )
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)
    print(dest.name, im.size)


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: prepare_perso.py <source.png> <slug>", file=sys.stderr)
        return 1
    src = Path(sys.argv[1])
    slug = sys.argv[2]
    prepare(src, ROOT / f"{slug}.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())