"""Build level assets from art/levels/level-N.png (clean art: no pixel in it —
the game draws the pixel itself, see src/game/levels.ts).

  level-N.webp, level-N-ext-top.webp, level-N-ext-bottom.webp

Usage:  python3 scripts/build_levels.py
"""
import glob
import os
import re

import cv2
from PIL import Image

from artlib import edge_strip

OUT = "public/assets/levels"
os.makedirs(OUT, exist_ok=True)

for path in sorted(glob.glob("art/levels/level-*.png")):
    n = re.search(r"level-(\d+)", path).group(1)
    img = cv2.imread(path)
    Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).save(f"{OUT}/level-{n}.webp", "WEBP", quality=90, method=6)
    edge_strip(img[:6], True, clean=True).save(f"{OUT}/level-{n}-ext-top.webp", "WEBP", quality=92)
    edge_strip(img[-6:], False, clean=True).save(f"{OUT}/level-{n}-ext-bottom.webp", "WEBP", quality=92)
    print(f"level {n}: {img.shape[1]}x{img.shape[0]}")
