"""Split the welcome artwork into a background layer and a start-button layer.

The supplied welcome art has the start button baked in. To animate the button
(hover / press) without the baked copy showing behind it, we:
  1. segment the button (yellow face, orange base, dark play icon, white rim),
  2. export it as a transparent layer,
  3. inpaint the background underneath it.

Usage:  python3 scripts/extract_welcome.py art/welcome-original.png
Prints the button box (source px) used in src/screens/welcome/layout.ts.
"""
import sys
import cv2
import numpy as np
from PIL import Image

OUT = "public/assets/welcome"
src = cv2.imread(sys.argv[1])  # BGR
H, W = src.shape[:2]
b, g, r = [src[:, :, i].astype(int) for i in range(3)]

# search window around the button
x0, y0, x1, y1 = 260, 1110, 830, 1350
roi = np.zeros((H, W), np.uint8)
roi[y0:y1, x0:x1] = 1

# saturated yellow / orange body
core = ((r > 140) & (b < 110) & (r - b > 90)).astype(np.uint8) & roi
n, lab, st, _ = cv2.connectedComponentsWithStats(core)
core = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)

# fill enclosed holes (the play icon)
ff = core * 255
cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (x0 + 2, y0 + 2), 255)
filled = core | (ff == 0).astype(np.uint8)

# white highlight rim hugging the top edge
near = cv2.dilate(filled, np.ones((13, 13), np.uint8))
bright = ((r > 248) & (g > 240) & (b > 235)).astype(np.uint8)
full = filled | (near & bright & roi)
full = cv2.morphologyEx(full, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))

# soft alpha edge
alpha = cv2.GaussianBlur(cv2.dilate(full, np.ones((3, 3), np.uint8)).astype(np.float32), (5, 5), 0)
ys, xs = np.where(alpha > 0.01)
bx0, by0, bx1, by1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3

rgb = cv2.cvtColor(src, cv2.COLOR_BGR2RGB)
rgba = np.dstack([rgb, (alpha * 255).clip(0, 255).astype(np.uint8)])[by0:by1, bx0:bx1]
Image.fromarray(rgba).save(f"{OUT}/start-button.webp", "WEBP", lossless=True, method=6)

hole = cv2.dilate(full, np.ones((11, 11), np.uint8)) * 255
bg = cv2.inpaint(src, hole, 9, cv2.INPAINT_TELEA)
Image.fromarray(cv2.cvtColor(bg, cv2.COLOR_BGR2RGB)).save(f"{OUT}/welcome-bg.webp", "WEBP", quality=90, method=6)

print(f"canvas {W}x{H}  button x={bx0} y={by0} w={bx1 - bx0} h={by1 - by0}")

# ---- edge extensions -------------------------------------------------------
# Phones are taller than the 3:4 art. These strips continue the art's own top /
# bottom edge (wall / desk) and are stretched to fill the remaining height.
def wall_only(edge):
    """Replace non-wall columns (plant greens / pot yellows, where blue is not
    dominant) by interpolating between neighbouring wall columns."""
    e = edge[0]
    bb, gg, rr = e[:, 0], e[:, 1], e[:, 2]
    ok = bb >= np.maximum(rr, gg) - 25
    xs = np.arange(e.shape[0])
    for c in range(3):
        e[:, c] = np.interp(xs, xs[ok], e[ok, c])
    return edge

def edge_strip(rows, toward_top):
    edge = rows.astype(np.float32).mean(axis=0, keepdims=True)          # 1 x W x 3
    if toward_top:
        edge = wall_only(edge)
    near = cv2.GaussianBlur(edge, (0, 0), sigmaX=16, sigmaY=0.1)
    far = cv2.GaussianBlur(edge, (0, 0), sigmaX=160, sigmaY=0.1)
    n = 96
    t = np.linspace(0, 1, n, dtype=np.float32)[:, None, None]            # 0 = at art edge
    t = t * t * (3 - 2 * t)
    strip = near * (1 - t) + far * t                                      # n x W x 3
    if toward_top:
        strip = strip[::-1]
    return Image.fromarray(cv2.cvtColor(strip.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB))

edge_strip(bg[:6], True).save(f"{OUT}/welcome-ext-top.webp", "WEBP", quality=92)
edge_strip(bg[-6:], False).save(f"{OUT}/welcome-ext-bottom.webp", "WEBP", quality=92)
