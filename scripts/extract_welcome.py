"""Build the welcome-screen layers from the source art.

Inputs (art/):
  welcome-bg.png     background illustration (no button), 972x1619
  start-button.png   start button, transparent PNG

Outputs (public/assets/welcome/):
  welcome-bg.webp          background with the small title pixel removed
  title-pixel.webp         the small black pixel shape next to the title (animated in code)
  mug.webp                 coffee mug (portfolio easter egg), heart painted out
  mug-code.svg             pixel-art </> printed on the mug (beats in code)
  start-button.webp
  welcome-ext-top.webp     strips that continue the art's top / bottom edge,
  welcome-ext-bottom.webp  stretched to fill phones taller than the art

Usage:  python3 scripts/extract_welcome.py
Prints the boxes (source px) used in src/screens/welcome/layout.ts.
"""
import cv2
import numpy as np
from PIL import Image

ART = "art"
OUT = "public/assets/welcome"

src = cv2.imread(f"{ART}/welcome-bg.png")  # BGR
H, W = src.shape[:2]

# ---- title pixel ------------------------------------------------------------
# dark component in the sky, top-right of the PIXEL badge
x0, y0, x1, y1 = 690, 575, 760, 630
dark = (src.max(axis=2) < 90).astype(np.uint8)
roi = np.zeros_like(dark)
roi[y0:y1, x0:x1] = 1
n, lab, st, _ = cv2.connectedComponentsWithStats(dark & roi)
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
shape = (lab == k).astype(np.uint8)

# alpha: shape + its anti-aliased rim
alpha = cv2.GaussianBlur(cv2.dilate(shape, np.ones((3, 3), np.uint8)).astype(np.float32), (3, 3), 0)
ys, xs = np.where(alpha > 0.02)
px0, py0, px1, py1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
rgb = cv2.cvtColor(src, cv2.COLOR_BGR2RGB)
sprite = np.dstack([rgb, (alpha * 255).clip(0, 255).astype(np.uint8)])[py0:py1, px0:px1]
Image.fromarray(sprite).save(f"{OUT}/title-pixel.webp", "WEBP", lossless=True, method=6)

hole = cv2.dilate(shape, np.ones((9, 9), np.uint8))
# Fill from sky only: treat the neighbouring dark badge (and its rim) as unknown
# too, so its black is not smeared into the sky, then put the badge back.
near = np.zeros_like(dark)
near[y0 - 20:y1 + 20, x0 - 40:x1 + 20] = 1
badge = cv2.dilate(dark & near & (1 - shape), np.ones((7, 7), np.uint8)) & (1 - hole)
bg = cv2.inpaint(src, (hole | badge) * 255, 7, cv2.INPAINT_TELEA)
bg[badge.astype(bool)] = src[badge.astype(bool)]

# ---- coffee mug + heart -------------------------------------------------------
# Mug is cut out with GrabCut seeded by a hand-traced outline (crop coords from a
# 3x zoom at offset 82,1002). The pixel heart is traced into a vector polygon so
# it stays sharp while it scales; it is removed from the mug layer.
def P(pts):
    return np.array([[82 + x / 3, 1002 + y / 3] for x, y in pts], np.float32).round().astype(np.int32)

outline = P([(128, 232), (200, 193), (300, 168), (400, 158), (440, 162), (462, 180), (472, 232),
             (526, 500), (523, 537), (468, 566), (380, 592), (260, 592), (212, 572), (200, 535),
             (130, 532), (78, 505), (55, 440), (60, 370), (95, 322), (140, 312)])
handle_gap = P([(112, 360), (150, 334), (186, 350), (196, 498), (150, 506), (110, 472), (100, 420)])
splash = P([(375, 215), (390, 140), (410, 112), (430, 125), (420, 180), (410, 215)])
drops = [((442, 78), 5), ((490, 100), 5), ((440, 143), 4)]

seed = np.zeros((H, W), np.uint8)
cv2.fillPoly(seed, [outline, splash], 1)
for c, rad in drops:
    cv2.circle(seed, tuple(int(v) for v in P([c])[0]), rad, 1, -1)
cv2.fillPoly(seed, [handle_gap], 0)
gc = np.full((H, W), cv2.GC_BGD, np.uint8)
gc[cv2.dilate(seed, np.ones((7, 7), np.uint8)) == 1] = cv2.GC_PR_BGD
gc[seed == 1] = cv2.GC_PR_FGD
gc[cv2.erode(seed, np.ones((9, 9), np.uint8)) == 1] = cv2.GC_FGD
cv2.fillPoly(gc, [cv2.convexHull(handle_gap)], int(cv2.GC_BGD))
cv2.grabCut(src, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 10, cv2.GC_INIT_WITH_MASK)
mug = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
mug = cv2.morphologyEx(mug, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
# the gap inside the handle travels with the mug (no seam when it moves)
ff = mug * 255
cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 255)
mug = mug | (ff == 0).astype(np.uint8)

# heart: dark component on the mug
hr = np.zeros((H, W), np.uint8)
hr[1095:1160, 168:236] = 1
heart = (src.max(axis=2) < 110).astype(np.uint8) & hr
n, lab, st, _ = cv2.connectedComponentsWithStats(heart)
heart = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
ys, xs = np.where(heart)
hx0, hy0, hx1, hy1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
heart_rgb = np.median(src[heart == 1], axis=0)[::-1]
hw, hh = hx1 - hx0, hy1 - hy0

# The mug carries a pixel-art "</>" (replaces the heart; heart is still detected
# above so it can be painted out of the mug layer). Square cells on an 18x9 grid,
# solid #000, tilted like the mug's front face and centred where the heart was.
CODE_GRID = [
    "..........##......",
    "...##.....##.##...",
    "..##.....##...##..",
    ".##......##....##.",
    "##......##......##",
    ".##.....##.....##.",
    "..##...##.....##..",
    "...##..##....##...",
    "......##..........",
]
CELL, TILT = 3.9, -14.0  # source px per cell, degrees (negative = counter-clockwise)
cols, rows = max(len(r) for r in CODE_GRID), len(CODE_GRID)
gw, gh = cols * CELL, rows * CELL
cx, cy = (hx0 + hx1) / 2, (hy0 + hy1) / 2
SW, SH = 80, 56  # svg box (fits the tilted grid)
sx0, sy0 = round(cx - SW / 2), round(cy - SH / 2)
# one path (not separate rects) so tilted neighbouring cells have no seams
cells = "".join(
    f"M{c * CELL:g} {r * CELL:g}h{CELL:g}v{CELL:g}h-{CELL:g}z"
    for r, line in enumerate(CODE_GRID) for c, ch in enumerate(line) if ch == "#"
)
ox, oy = cx - sx0 - gw / 2, cy - sy0 - gh / 2
with open(f"{OUT}/mug-code.svg", "w") as f:
    f.write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SW} {SH}">'
        f'<g fill="#000" transform="rotate({TILT} {SW / 2} {SH / 2}) translate({ox:.2f} {oy:.2f})">'
        f'<path d="{cells}"/></g></svg>\n'
    )

# mug layer with the heart (and its light rim) painted out
heart_hole = cv2.dilate(heart, np.ones((9, 9), np.uint8))
mug_img = cv2.inpaint(src, heart_hole * 255, 5, cv2.INPAINT_TELEA)
alpha = cv2.GaussianBlur(mug.astype(np.float32), (3, 3), 0)
ys, xs = np.where(alpha > 0.02)
mx0, my0, mx1, my1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
mug_rgba = np.dstack([cv2.cvtColor(mug_img, cv2.COLOR_BGR2RGB), (alpha * 255).astype(np.uint8)])
Image.fromarray(mug_rgba[my0:my1, mx0:mx1]).save(f"{OUT}/mug.webp", "WEBP", lossless=True, method=6)

# background under the mug: rebuild wall/desk row by row by interpolating
# between the nearest clean wall/desk pixels left and right of the mug
# (cat, keyboard, monitor stand and other dark objects are skipped).
mug_hole = cv2.dilate(mug, np.ones((9, 9), np.uint8)).astype(bool)
ys, xs = np.where(mug_hole)
zx0, zx1 = max(xs.min() - 60, 0), min(xs.max() + 60, W)
clean = (src.max(axis=2) > 175) & (src.min(axis=2) > 150) & ~mug_hole  # light wall / desk
layer = bg.astype(np.float32)
for y in range(ys.min(), ys.max() + 1):
    row = np.where(mug_hole[y])[0]
    if row.size == 0:
        continue
    a, b = row.min(), row.max()
    left = [x for x in range(a - 1, zx0, -1) if clean[y, x]][:6]
    right = [x for x in range(b + 1, zx1) if clean[y, x]][:6]
    cl = src[y, left].mean(axis=0) if left else None
    cr = src[y, right].mean(axis=0) if right else None
    cl = cr if cl is None else cl
    cr = cl if cr is None else cr
    t = np.linspace(0, 1, b - a + 1)[:, None]
    seg = cl * (1 - t) + cr * t
    layer[y, a:b + 1][mug_hole[y, a:b + 1]] = seg[mug_hole[y, a:b + 1]]
# soften row-to-row steps inside the filled area only
soft = cv2.GaussianBlur(layer, (0, 0), 3)
bg = bg.copy()
bg[mug_hole] = soft[mug_hole].clip(0, 255).astype(np.uint8)

Image.fromarray(cv2.cvtColor(bg, cv2.COLOR_BGR2RGB)).save(
    f"{OUT}/welcome-bg.webp", "WEBP", quality=90, method=6
)

# ---- start button -----------------------------------------------------------
btn = Image.open(f"{ART}/start-button.png")
btn.save(f"{OUT}/start-button.webp", "WEBP", lossless=True, method=6)

# ---- edge extensions ----------------------------------------------------------
def edge_strip(rows, toward_top):
    edge = rows.astype(np.float32).mean(axis=0, keepdims=True)  # 1 x W x 3
    near = cv2.GaussianBlur(edge, (0, 0), sigmaX=16, sigmaY=0.1)
    far = cv2.GaussianBlur(edge, (0, 0), sigmaX=160, sigmaY=0.1)
    n = 96
    t = np.linspace(0, 1, n, dtype=np.float32)[:, None, None]  # 0 = at art edge
    t = t * t * (3 - 2 * t)
    strip = near * (1 - t) + far * t
    if toward_top:
        strip = strip[::-1]
    return Image.fromarray(cv2.cvtColor(strip.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB))

edge_strip(bg[:6], True).save(f"{OUT}/welcome-ext-top.webp", "WEBP", quality=92)
edge_strip(bg[-6:], False).save(f"{OUT}/welcome-ext-bottom.webp", "WEBP", quality=92)

print(f"canvas {W}x{H}")
print(f"title pixel x={px0} y={py0} w={px1 - px0} h={py1 - py0}")
print(f"button {btn.size[0]}x{btn.size[1]}")
print(f"mug x={mx0} y={my0} w={mx1 - mx0} h={my1 - my0}")
print(f"code symbol svg box x={sx0} y={sy0} w={SW} h={SH}")
