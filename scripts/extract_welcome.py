"""Build the welcome-screen layers from the source art.

Inputs (art/):
  welcome-bg.png     background illustration (no button), 972x1619
  start-button.png   start button, transparent PNG

Outputs (public/assets/welcome/):
  welcome-bg.webp          background with the small title pixel removed
  title-pixel.webp         the small black pixel shape next to the title (animated in code)
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
