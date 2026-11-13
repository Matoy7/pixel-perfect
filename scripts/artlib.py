"""Shared helpers for the art pipeline."""
import cv2
import numpy as np
from PIL import Image


def edge_strip(rows_bgr, toward_top, n=96):
    """Strip that continues an image edge (1 x W average row), blurring out as it
    goes away from the art. Stretched in CSS to fill phones taller than the art."""
    edge = rows_bgr.astype(np.float32).mean(axis=0, keepdims=True)
    near = cv2.GaussianBlur(edge, (0, 0), sigmaX=16, sigmaY=0.1)
    far = cv2.GaussianBlur(edge, (0, 0), sigmaX=160, sigmaY=0.1)
    t = np.linspace(0, 1, n, dtype=np.float32)[:, None, None]
    t = t * t * (3 - 2 * t)
    strip = near * (1 - t) + far * t
    if toward_top:
        strip = strip[::-1]
    return Image.fromarray(cv2.cvtColor(strip.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB))


def fill_holes(m):
    h, w = m.shape
    ff = m.astype(np.uint8) * 255
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 255)
    return m.astype(np.uint8) | (ff == 0).astype(np.uint8)


def components(m, min_area):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    return [(lab == i).astype(np.uint8) for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= min_area]


def save_rgba(src_bgr, alpha, path, box=None):
    """Save src pixels with a float alpha (0..1) as lossless webp, cropped to alpha
    bbox (or the given box). Returns the box (x, y, w, h) in source px."""
    if box is None:
        ys, xs = np.where(alpha > 0.01)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    else:
        x0, y0, w, h = box
        x1, y1 = x0 + w, y0 + h
    rgb = cv2.cvtColor(src_bgr, cv2.COLOR_BGR2RGB)
    rgba = np.dstack([rgb, (alpha.clip(0, 1) * 255).astype(np.uint8)])[y0:y1, x0:x1]
    Image.fromarray(rgba).save(path, "WEBP", lossless=True, method=6)
    return int(x0), int(y0), int(x1 - x0), int(y1 - y0)
