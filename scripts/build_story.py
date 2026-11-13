"""Build the story-sequence assets from art/story/scene-{1..5}.png (942x1670).

Every scene: a webp + top/bottom edge strips (for phones taller than 9:16).

Scene 4 (the fight) is additionally split into layers so only the dust cloud
moves:
  scene-4-bg.webp       scene with cloud + puffs removed (filled from surroundings)
  scene-4-cloud.webp    the main cloud (characters painted out)
  scene-4-lobe-N.webp   soft-edged sections of the cloud, animated independently
  scene-4-puff-N.webp   the three small side puffs
  scene-4-chars.webp    cat head, paws, yarn + yellow marks (static, on top)

Usage:  python3 scripts/build_story.py
Prints the boxes (source px) used in src/screens/story/scenes.ts.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

from artlib import components, edge_strip, fill_holes, save_rgba

ART = "art/story"
OUT = "public/assets/story"
os.makedirs(OUT, exist_ok=True)

for n in range(1, 6):
    img = cv2.imread(f"{ART}/scene-{n}.png")
    Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).save(
        f"{OUT}/scene-{n}.webp", "WEBP", quality=90, method=6
    )
    edge_strip(img[:6], True).save(f"{OUT}/scene-{n}-ext-top.webp", "WEBP", quality=92)
    edge_strip(img[-6:], False).save(f"{OUT}/scene-{n}-ext-bottom.webp", "WEBP", quality=92)

# ---------------------------------------------------------------------------
# Scene 4: layered dust cloud
# ---------------------------------------------------------------------------
src = cv2.imread(f"{ART}/scene-4.png")
H, W = src.shape[:2]
b, g, r = [src[:, :, i].astype(int) for i in range(3)]
X0, Y0, X1, Y1 = 200, 1003, 720, 1315  # main cloud search box
box = np.zeros((H, W), np.uint8)
box[Y0:Y1, X0:X1] = 1

# characters + yellow marks: stay static, drawn on top of the cloud
brown = ((np.maximum(np.maximum(r, g), b) < 110) & (r >= b - 6)).astype(np.uint8) & box
red = ((r > 170) & (g < 120) & (b < 130)).astype(np.uint8)
red[:, :X0] = 0
red[:Y0] = 0
red[Y1:] = 0
yellow = ((r > 220) & (g > 170) & (b < 110)).astype(np.uint8)
yellow[:950] = 0
yellow[1320:] = 0
chars = np.zeros((H, W), np.uint8)
brown = cv2.morphologyEx(brown, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
for c in components(brown, 300) + components(red, 80) + components(yellow, 40):
    chars |= fill_holes(cv2.morphologyEx(c, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)))
chars = cv2.dilate(chars, np.ones((3, 3), np.uint8))

# main cloud: warm white mass, closed + hole-filled, grown to include its outline
white = ((r >= 249) & (g >= 242) & (b >= 236)).astype(np.uint8) & box  # warm cloud white
white = cv2.morphologyEx(white, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
main = max(components(white, 500), key=lambda m: m.sum())
ell = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
navy = ((b - r > 20) & (np.maximum(np.maximum(r, g), b) < 170)).astype(np.uint8)
warm_white = ((r >= 249) & (g >= 242) & (b >= 236)).astype(np.uint8)
core = fill_holes(cv2.morphologyEx(main, cv2.MORPH_CLOSE, ell(17)))
# grow out to the cloud's navy outline (with the lavender shading band between)
outline = navy & cv2.dilate(core, ell(25))
# characters sitting in the cloud: the cloud stays solid underneath them
inside = chars & cv2.dilate(core, ell(15))
cloud = fill_holes(cv2.morphologyEx(core | outline | inside, cv2.MORPH_CLOSE, ell(9)))
cloud = cv2.dilate(cloud, ell(3))

# small side puffs (separate little clouds)
puff_boxes = [(118, 1108, 75, 66), (690, 985, 90, 66), (684, 1232, 52, 44)]
puffs = []
for (x, y, w, h) in puff_boxes:
    m = np.zeros((H, W), np.uint8)
    m[y:y + h, x:x + w] = (warm_white | navy)[y:y + h, x:x + w]
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, ell(5))
    m = max(components(m, 30), key=lambda c: c.sum())
    puffs.append(cv2.dilate(fill_holes(m), ell(3)))

# background: remove cloud + puffs, fill from the surroundings
hole = cloud.copy()
for m in puffs:
    hole |= m
hole = cv2.dilate(hole, ell(5))
bg = cv2.inpaint(src, hole * 255, 9, cv2.INPAINT_TELEA)
Image.fromarray(cv2.cvtColor(bg, cv2.COLOR_BGR2RGB)).save(f"{OUT}/scene-4-bg.webp", "WEBP", quality=90, method=6)

# cloud layer: characters painted out with cloud texture (they sit on top anyway)
# also any leftover warm/saturated (yarn red, yellow marks) or cat-brown pixels
# (paint out the whole foreign objects, not just their overlap with the cloud,
#  so the fill samples only cloud white / wall and never the objects themselves)
near = cv2.dilate(cloud, ell(41))
foreign = ((r - b > 35) | ((np.maximum(np.maximum(r, g), b) < 110) & (r >= b - 6))).astype(np.uint8) & near
paint_out = (cv2.dilate(chars, ell(11)) | cv2.dilate(foreign, ell(5))) & near
cloud_img = cv2.inpaint(src, paint_out * 255, 7, cv2.INPAINT_TELEA)
cloud_a = cv2.GaussianBlur(cloud.astype(np.float32), (3, 3), 0)
boxes = {"cloud": save_rgba(cloud_img, cloud_a, f"{OUT}/scene-4-cloud.webp")}

# lobes: soft circular sections of the cloud near its edge
ys, xs = np.where(cloud)
cx, cy = float(xs.mean()), float(ys.mean())
LOBES = [(262, 1185, 62), (335, 1075, 60), (470, 1032, 58), (605, 1080, 60), (668, 1190, 58),
         (335, 1270, 58), (560, 1275, 60)]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
boxes["lobes"] = []
for i, (lx, ly, rad) in enumerate(LOBES, 1):
    d = np.sqrt((xx - lx) ** 2 + (yy - ly) ** 2)
    soft = np.clip((rad - d) / (rad * 0.45), 0, 1)
    soft = soft * soft * (3 - 2 * soft)
    a = cloud_a * soft
    bx = save_rgba(cloud_img, a, f"{OUT}/scene-4-lobe-{i}.webp")
    # outward unit normal from the cloud centre (for the bulge direction)
    nx, ny = lx - cx, ly - cy
    ln = (nx * nx + ny * ny) ** 0.5
    boxes["lobes"].append({"box": bx, "normal": [round(nx / ln, 3), round(ny / ln, 3)]})

boxes["puffs"] = [save_rgba(src, cv2.GaussianBlur(m.astype(np.float32), (3, 3), 0), f"{OUT}/scene-4-puff-{i}.webp")
                  for i, m in enumerate(puffs, 1)]
# opaque (original pixels incl. their anti-aliased rim): nothing below shows through
chars_hard = cv2.dilate(chars, ell(5)).astype(np.float32)
boxes["chars"] = save_rgba(src, chars_hard, f"{OUT}/scene-4-chars.webp")
boxes["cloudCenter"] = [round(cx, 1), round(cy, 1)]

print(json.dumps(boxes))

# ---------------------------------------------------------------------------
# Scene 1 clock (for the "time passes" close-up): clean face + real hands
# ---------------------------------------------------------------------------
s1 = cv2.imread(f"{ART}/scene-1.png")
dark = s1.max(axis=2).astype(int) < 110
yy1, xx1 = np.mgrid[0:H, 0:W]
ring = np.where(dark[440:660, 40:280])
CX = (s1[549, 40:280].max(axis=1) < 110).nonzero()[0]
CX = (CX.min() + CX.max()) / 2 + 40  # outer ring left/right → centre x
col = (s1[430:670, int(CX)].max(axis=1) < 110).nonzero()[0]
CY = (col.min() + col.max()) / 2 + 430
R = 106
dx, dy = xx1 - CX, yy1 - CY
rad = np.sqrt(dx * dx + dy * dy)
minute = dark & (np.abs(dx) <= 6) & (dy < 0) & (rad <= 89)
hour = dark & (np.abs(dy) <= 6) & (dx < 0) & (rad <= 72)
cap = dark & (rad <= 10)
hands = (minute | hour | cap).astype(np.uint8)

face_col = np.median(s1[(rad < 60) & ~cv2.dilate(hands, ell(9)).astype(bool)], axis=0)
hand_col = np.median(s1[cv2.erode(minute.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)], axis=0)
lum = lambda c: c[..., 0] * 0.114 + c[..., 1] * 0.587 + c[..., 2] * 0.299
L = lum(s1.astype(np.float32))
hand_alpha = np.clip((lum(face_col) - L) / (lum(face_col) - lum(hand_col)), 0, 1)

def hand_sprite(mask, box, path):
    m = cv2.dilate(mask.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
    flat = np.zeros_like(s1)
    flat[:] = hand_col.astype(np.uint8)
    return save_rgba(flat, hand_alpha * m, path, box)

CXi, CYi = int(round(CX)), int(round(CY))
clock = {"center": [round(float(CX), 1), round(float(CY), 1)]}
clock["minute"] = hand_sprite(minute, (CXi - 8, CYi - 92, 16, 92), f"{OUT}/clock-minute.webp")
clock["hour"] = hand_sprite(hour, (CXi - 75, CYi - 8, 75, 16), f"{OUT}/clock-hour.webp")
clock["cap"] = hand_sprite(cap, (CXi - 12, CYi - 12, 24, 24), f"{OUT}/clock-cap.webp")

# face without hands; the 12 o'clock tick (partly under the minute hand) is
# restored from the 6 o'clock tick rotated 180°
face = cv2.inpaint(s1, cv2.dilate(hands, ell(7)) * 255, 5, cv2.INPAINT_TELEA)
t6 = s1[CYi + 70:CYi + 100, CXi - 8:CXi + 9]
face[CYi - 99:CYi - 69, CXi - 8:CXi + 9] = t6[::-1, ::-1]
fb = (CXi - R - 6, CYi - R - 6, 2 * R + 12, 2 * R + 12)
clock["face"] = save_rgba(face, np.ones((H, W), np.float32), f"{OUT}/clock-face.webp", fb)
print("CLOCK", json.dumps(clock))
