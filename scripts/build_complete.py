"""Cut the trophy out of the completion-screen reference.

  art/complete/complete-reference.png  →  public/assets/complete/trophy.webp
The reference has a flat lavender background, so the trophy (incl. its soft
shadow) is separated by colour distance and un-mixed from the background
for clean semi-transparent edges.

Usage:  python3 scripts/build_complete.py
"""
import numpy as np
from PIL import Image

ref = np.asarray(Image.open("art/complete/complete-reference.png").convert("RGB")).astype(np.float32)
x0, y0, x1, y1 = 285, 360, 666, 687  # trophy + shadow (ink box 291-658 x 367-680)
crop = ref[y0:y1, x0:x1]
bg = np.median(np.concatenate([ref[:200, :200].reshape(-1, 3), ref[-200:, -200:].reshape(-1, 3)]), axis=0)

dist = np.abs(crop - bg).max(axis=2)
alpha = np.clip((dist - 4) / 40, 0, 1)
a3 = np.maximum(alpha[..., None], 1e-3)
rgb = np.clip((crop - (1 - a3) * bg) / a3, 0, 255)  # remove the background tint from edges
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
Image.fromarray(out, "RGBA").save("public/assets/complete/trophy.webp", "WEBP", lossless=True, method=6)
print("trophy", out.shape[1], "x", out.shape[0], "bg", bg)
