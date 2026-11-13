"""Build the favicon set and the social-preview image.

  public/favicon.svg, favicon-32.png, apple-touch-icon.png (180), icon-512.png
      a lavender tile with the game's black pixel and two pixel fragments
      flying off it (like the title pixel's animation)
  public/og-image.jpg (1200x630, kept well under 300 KB)
      the welcome art's monitor with the PIXEL PERFECT title.
      WhatsApp silently drops preview images over ~300 KB (officially 600 KB),
      so this is a JPEG with its quality stepped down until it fits.

Usage:  python3 scripts/build_meta.py
"""
from PIL import Image, ImageDraw

BG = (232, 217, 242)  # welcome lavender #e8d9f2
PX = (0, 0, 0)

# icon geometry on a 64-unit grid: main pixel + two fragments up-right
SHAPES = [(14, 22, 28), (44, 14, 8), (52, 6, 5)]  # (x, y, size)


def icon(size):
    s = size / 64
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(14 * s), fill=BG)
    for x, y, w in SHAPES:
        d.rectangle((round(x * s), round(y * s), round((x + w) * s) - 1, round((y + w) * s) - 1), fill=PX)
    return im


icon(32).save("public/favicon-32.png")
icon(180).convert("RGB").save("public/apple-touch-icon.png")  # iOS: no transparency
icon(512).save("public/icon-512.png")
rects = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{w}"/>' for x, y, w in SHAPES)
with open("public/favicon.svg", "w") as f:
    f.write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">'
        '<rect width="64" height="64" rx="14" fill="#e8d9f2"/>'
        f'<g fill="#000">{rects}</g></svg>\n'
    )

# social preview: 1200x630 crop around the monitor + title of the welcome art
art = Image.open("art/welcome-bg.png").convert("RGB")
W = art.width
H = round(W * 630 / 1200)
cy = 690  # title centre on the monitor (source px)
og = art.crop((0, cy - H // 2, W, cy - H // 2 + H)).resize((1200, 630), Image.LANCZOS)
import io, os

LIMIT = 250 * 1024  # margin under WhatsApp's ~300 KB
for q in range(90, 59, -5):
    buf = io.BytesIO()
    og.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
    if buf.tell() <= LIMIT:
        break
with open("public/og-image.jpg", "wb") as f:
    f.write(buf.getvalue())
if os.path.exists("public/og-image.png"):
    os.remove("public/og-image.png")
print(f"og {og.size} jpeg q={q} {buf.tell() // 1024} KB")
