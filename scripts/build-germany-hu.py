"""Cuts the inspection stickers (HU) out of assets/germany-seals/hu-colours.png (ADAC colour chart 2020–2031).

  python scripts/build-germany-hu.py

Writes public/plates/germany/hu/<yy>.png for 2000–2039. The years 2020–2031 are the real stickers from the chart;
other years reuse the sticker of the same colour (colours repeat every six years) with the centre number redrawn.
"""
from PIL import Image, ImageDraw, ImageFont
from collections import Counter
import os
ROOT = os.path.join(os.path.dirname(__file__), "..")
src = Image.open(os.path.join(ROOT, "assets/germany-seals/hu-colours.png")).convert("RGBA")
OUT = os.path.join(ROOT, "public/plates/germany/hu")
os.makedirs(OUT, exist_ok=True)
D = 227
ROW1 = [33, 275, 517, 760, 1002, 1244]; Y1 = 115
ROW2 = [32, 274, 517, 759, 1001, 1244]; Y2 = 456

def cut(x, y):
    c = src.crop((x, y, x + D, y + D))
    m = Image.new("L", (D, D), 0)
    ImageDraw.Draw(m).ellipse([1, 1, D - 2, D - 2], fill=255)
    c.putalpha(m)
    return c

real = {}
for i, x in enumerate(ROW1): real[20 + i] = cut(x, Y1)
for i, x in enumerate(ROW2): real[26 + i] = cut(x, Y2)

def face_colour(im):
    cnt = Counter(p[:3] for p in im.convert("RGB").getdata() if p[:3] != (0, 0, 0) and max(p[:3]) - min(p[:3]) > 40)
    return cnt.most_common(1)[0][0]

font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 36)
for yy in range(0, 40):
    if yy in real:
        im = real[yy].copy()
    else:
        base = real[20 + ((yy - 20) % 6)]                      # the real sticker of the same colour
        im = base.copy()
        d = ImageDraw.Draw(im)
        c = D / 2
        d.ellipse([c - 24, c - 24, c + 24, c + 24], fill=face_colour(base) + (255,))
        d.ellipse([c - 26, c - 26, c + 26, c + 26], outline=(0, 0, 0, 255), width=2)
        d.text((c, c + 1), f"{yy:02d}", fill=(0, 0, 0, 255), font=font, anchor="mm")
    im.save(os.path.join(OUT, f"{yy:02d}.png"))
print("stickers:", len(os.listdir(OUT)))
