"""Builds the German plate artwork from assets/germany-source.png (the 520 mm plate with lettering).

  python scripts/build-germany-art.py

Writes public/plates/germany/single.png (blank face: border + euroband + D) and
public/plates/germany/seals.png (inspection sticker over a blank state seal, stacked, transparent corners).
"""
from PIL import Image, ImageDraw
import os
ROOT = os.path.join(os.path.dirname(__file__), "..")
src = Image.open(os.path.join(ROOT, "assets/germany-source.png")).convert("RGBA")
W, H = src.size
OUT = os.path.join(ROOT, "public/plates/germany")
os.makedirs(OUT, exist_ok=True)

# blank face: everything right of the euroband and inside the border becomes white
face = src.copy()
d = ImageDraw.Draw(face)
d.rectangle([156, 22, 1898, 369], fill=(255, 255, 255, 255))
# the face has rounded corners on the right (the border's inner edge is round), so no white pokes into the border
R = 22
for (cx, cy, x0, y0, x1, y1) in [(1904 - R, 16 + R, 1904 - R, 16, 1904, 16 + R), (1904 - R, 374 - R, 1904 - R, 374 - R, 1904, 374)]:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 > R * R and face.getpixel((x, y))[:3] == (255, 255, 255):
                face.putpixel((x, y), (0, 0, 0, 255))
face.save(os.path.join(OUT, "single.png"))

# seals: sticker (centre 647,112 r67) over seal (centre 647,285 r79)
def circle_crop(cx, cy, r):
    box = (cx - r, cy - r, cx + r, cy + r)
    c = src.crop(box)
    m = Image.new("L", c.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, c.size[0] - 1, c.size[1] - 1], fill=255)
    c.putalpha(m)
    return c
sticker = circle_crop(647, 112, 67)
seal = circle_crop(647, 285, 79)
# blank the seal: keep a plain grey disc with a thin ring
g = seal.getpixel((seal.size[0] // 2, 6))
sd = ImageDraw.Draw(seal)
R = seal.size[0] / 2
sd.ellipse([R * 0.12, R * 0.12, R * 1.88, R * 1.88], fill=(200, 200, 200, 255), outline=(120, 120, 120, 255), width=2)
sd.ellipse([R * 0.30, R * 0.30, R * 1.70, R * 1.70], outline=(150, 150, 150, 255), width=2)
S = Image.new("RGBA", (162, 322), (0, 0, 0, 0))
S.alpha_composite(sticker, (162 // 2 - 67, 0))
S.alpha_composite(seal, (162 // 2 - 79, 322 - 158))
S.save(os.path.join(OUT, "seals.png"))
print("ok", S.size)
