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


# Per-level art fixes (applied at build time; the source art stays untouched)
FIXES = {
    # Level 1: the banana bunch's dark stem tip looked like the black pixel → banana yellow
    "1": lambda img: recolor_dark(img, (541, 595, 22, 21), dark_bgr=(18, 160, 222), light_bgr=(40, 214, 252)),
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
