"""Retire fond gris + filigrane Luma AI de la vidéo Reginald → WebM transparent."""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

PERSOS = (
    Path(__file__).resolve().parents[1]
    / "frontend"
    / "public"
    / "images"
    / "persos"
)
SRC = PERSOS / "reginald-scepter-toss.mp4"
OUT = PERSOS / "reginald-scepter-toss.webm"

BG = np.array([204.0, 203.0, 206.0], dtype=np.float32)
KEY_START = 10.0
KEY_SOFT = 38.0
LOGO_BOX = (0, 0, 285, 108)  # x0, y0, x1, y1 — zone « Luma AI »


def key_frame(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    rgb = np.array(rgba.convert("RGB"), dtype=np.float32)
    dist = np.linalg.norm(rgb - BG, axis=2)

    alpha = np.clip((dist - KEY_START) / KEY_SOFT, 0.0, 1.0)
    alpha = (alpha * 255.0).astype(np.uint8)

    x0, y0, x1, y1 = LOGO_BOX
    alpha[y0:y1, x0:x1] = 0

    out = np.dstack([rgb.astype(np.uint8), alpha])
    return Image.fromarray(out, "RGBA")


def main() -> int:
    if not SRC.exists():
        print("missing", SRC, file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory(prefix="reginald-clean-") as tmp:
        tmp_path = Path(tmp)
        pattern = tmp_path / "frame_%04d.png"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(SRC),
                "-vf",
                "fps=24",
                str(pattern),
            ],
            check=True,
            capture_output=True,
        )

        frames = sorted(tmp_path.glob("frame_*.png"))
        clean_dir = tmp_path / "clean"
        clean_dir.mkdir()
        for i, fp in enumerate(frames):
            key_frame(Image.open(fp)).save(clean_dir / f"frame_{i:04d}.png")

        OUT.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                "24",
                "-i",
                str(clean_dir / "frame_%04d.png"),
                "-c:v",
                "libvpx-vp9",
                "-pix_fmt",
                "yuva420p",
                "-auto-alt-ref",
                "0",
                "-b:v",
                "0",
                "-crf",
                "32",
                str(OUT),
            ],
            check=True,
        )

    print("ok", OUT, "size", OUT.stat().st_size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())