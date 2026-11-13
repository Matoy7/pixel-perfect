"""Build the tutorial (jar) assets from art/tutorial/jar.png (1086x1448).

  jar.webp               the illustration as supplied (shown during play)
  jar-clean.webp         same, with the black square painted out — revealed
                         after the success burst (stand-in until a clean
                         version of the art is supplied)
  jar-ext-top/bottom     edge strips for phones taller than the art

Usage:  python3 scripts/build_tutorial.py
"""
import os

import cv2
import numpy as np
from PIL import Image

from artlib import edge_strip

ART = "art/tutorial"
OUT = "public/assets/tutorial"
os.makedirs(OUT, exist_ok=True)

src = cv2.imread(f"{ART}/jar.png")
H, W = src.shape[:2]
to_pil = lambda bgr: Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
to_pil(src).save(f"{OUT}/jar.webp", "WEBP", quality=90, method=6)

# the dark square (with its bevel) inside the jar
dark = ((src.max(axis=2) < 80) & ((src.max(axis=2).astype(int) - src.min(axis=2)) < 14)).astype(np.uint8)  # neutral charcoal only
roi = np.zeros_like(dark)
roi[770:930, 540:710] = 1
n, lab, st, _ = cv2.connectedComponentsWithStats(dark & roi)
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
x, y, w, h = st[k, :4]
print(f"square x={x} y={y} w={w} h={h} centre=({x + w / 2:.1f},{y + h / 2:.1f})")
hole = np.zeros_like(dark)
hole[y - 4:y + h + 4, x - 4:x + w + 4] = 1
clean = cv2.inpaint(src, hole * 255, 15, cv2.INPAINT_TELEA)
to_pil(clean).save(f"{OUT}/jar-clean.webp", "WEBP", quality=90, method=6)

edge_strip(src[:6], True, clean=True).save(f"{OUT}/jar-ext-top.webp", "WEBP", quality=92)
edge_strip(src[-6:], False, clean=True).save(f"{OUT}/jar-ext-bottom.webp", "WEBP", quality=92)
