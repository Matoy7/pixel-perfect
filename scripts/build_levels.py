"""Build level assets from art/levels/level-N.png (clean art: no pixel in it —
the game draws the pixel itself, see src/game/levels.ts).

  level-N.webp, level-N-ext-top.webp, level-N-ext-bottom.webp

Usage:  python3 scripts/build_levels.py
"""
import glob
import os
import re

import cv2
import numpy as np
from PIL import Image

from artlib import edge_strip

OUT = "public/assets/levels"


def recolor_dark(img, box, dark_bgr, light_bgr, thresh=150):
    """Recolour dark pixels inside box (x, y, w, h) to a shaded colour, keeping
    the original light/shade and blending anti-aliased edges. Used to remove
    accidental 'black pixel' look-alikes from level art."""
    x, y, w, h = box
    roi = img[y:y + h, x:x + w].astype(np.float32)
    mx = roi.max(axis=2)
    alpha = np.clip((thresh - mx) / (thresh - 70), 0, 1)[..., None]  # 1 = fully dark
    lum = roi.mean(axis=2)
    core = alpha[..., 0] > 0.95
    lo, hi = (lum[core].min(), lum[core].max()) if core.any() else (0, 1)
    t = np.clip((lum - lo) / max(hi - lo, 1), 0, 1)[..., None]
    target = np.array(dark_bgr, np.float32) * (1 - t) + np.array(light_bgr, np.float32) * t
    img[y:y + h, x:x + w] = (roi * (1 - alpha) + target * alpha).clip(0, 255).astype(np.uint8)


def paint_out_rows(img, box, pad=3):
    """Remove an element inside box (x, y, w, h) on a flat-ish surface: each row
    is rebuilt by interpolating the surface colour just left and right of it."""
    x, y, w, h = box
    for r in range(y, y + h):
        left = img[r, x - pad - 2:x - pad + 1].astype(np.float32).mean(axis=0)
        right = img[r, x + w + pad - 1:x + w + pad + 2].astype(np.float32).mean(axis=0)
        t = np.linspace(0, 1, w + 2 * pad)[:, None]
        img[r, x - pad:x + w + pad] = (left * (1 - t) + right * t).astype(np.uint8)
    # soften the row seams inside the patch
    patch = img[y - 1:y + h + 1, x - pad:x + w + pad]
    img[y:y + h, x - pad:x + w + pad] = cv2.GaussianBlur(patch, (3, 3), 0)[1:-1]


# Per-level art fixes (applied at build time; the source art stays untouched)
FIXES = {
    # Level 1: the banana bunch's dark stem tip looked like the black pixel → banana yellow
    "1": lambda img: recolor_dark(img, (541, 595, 22, 21), dark_bgr=(18, 160, 222), light_bgr=(40, 214, 252)),
    # Level 3: the black label on the yellow suitcase (carousel) looked like the pixel → suitcase yellow
    "3": lambda img: paint_out_rows(img, (770, 1080, 19, 22)),
}
os.makedirs(OUT, exist_ok=True)

for path in sorted(glob.glob("art/levels/level-*.png")):
    n = re.search(r"level-(\d+)", path).group(1)
    img = cv2.imread(path)
    if n in FIXES:
        FIXES[n](img)
    Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).save(f"{OUT}/level-{n}.webp", "WEBP", quality=90, method=6)
    edge_strip(img[:6], True, clean=True).save(f"{OUT}/level-{n}-ext-top.webp", "WEBP", quality=92)
    edge_strip(img[-6:], False, clean=True).save(f"{OUT}/level-{n}-ext-bottom.webp", "WEBP", quality=92)
    print(f"level {n}: {img.shape[1]}x{img.shape[0]}")
