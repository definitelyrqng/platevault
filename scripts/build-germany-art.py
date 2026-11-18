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

# blank face: the border and the face are drawn fresh (clean rounded corners, a faint gradient and an inner rim), the euroband comes from the photo
SS = 4
big = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
bd = ImageDraw.Draw(big)
bd.rounded_rectangle([0, 0, W * SS - 1, H * SS - 1], radius=38 * SS, fill=(0, 0, 0, 255))
FX0, FY0, FX1, FY1 = 150, 16, 1904, 373
face_mask = Image.new("L", big.size, 0)
ImageDraw.Draw(face_mask).rounded_rectangle([FX0 * SS - 40 * SS, FY0 * SS, FX1 * SS, FY1 * SS], radius=20 * SS, fill=255)
grad = Image.new("RGBA", big.size, (255, 255, 255, 255))
gd = ImageDraw.Draw(grad)
for y in range(FY0 * SS, FY1 * SS + 1):
    t = (y - FY0 * SS) / ((FY1 - FY0) * SS)
    v = round(255 - 14 * t)                                   # white at the top, a touch greyer at the bottom
    gd.line([(0, y), (big.size[0], y)], fill=(v, v, v, 255))
big.paste(grad, (0, 0), face_mask)
# faint inner rim just inside the border
ImageDraw.Draw(big).rounded_rectangle([FX0 * SS, FY0 * SS + 2 * SS, FX1 * SS - 2 * SS, FY1 * SS - 2 * SS], radius=13 * SS, outline=(222, 222, 222, 255), width=2 * SS)
face = big.resize((W, H), Image.LANCZOS)
# a fine grain in the face (stamped sheet metal, not a flat fill)
import random
random.seed(7)
from PIL import ImageChops
noise = Image.effect_noise((W, H), 14).point(lambda p: max(0, min(255, p // 5)))       # 0..51, mean ~25
grain = Image.merge("RGB", (noise, noise, noise))
fmask = face_mask.resize((W, H), Image.LANCZOS)
fr = ImageChops.add(face.convert("RGB"), grain, 1, -25)
face.paste(fr, (0, 0), fmask)
face.paste(src.crop((0, 0, 156, H)), (0, 0))                  # border corners and euroband (stars, D) from the photo
def clip_corners(im, r):
    k = 4
    m = Image.new("L", (im.size[0] * k, im.size[1] * k), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] * k - 1, im.size[1] * k - 1], radius=r * k, fill=255)
    m = m.resize(im.size, Image.LANCZOS)
    out = im.copy(); out.putalpha(ImageChops.multiply(im.getchannel("A"), m)); return out
face = clip_corners(face, 38)
face.save(os.path.join(OUT, "single.png"))

# shortened plates: the same plate with a slice cut out of the middle of the white face (lengths in mm as the shops offer them)
PX_PER_MM = W / 520
for L in (480, 460, 440, 420, 400, 380, 360, 340):
    cut = round((520 - L) * PX_PER_MM)
    c0, c1 = 1000, 1000 + cut
    short = Image.new("RGBA", (W - cut, H), (0, 0, 0, 0))
    short.paste(face.crop((0, 0, c0, H)), (0, 0))
    short.paste(face.crop((c1, 0, W, H)), (c0, 0))
    short.save(os.path.join(OUT, f"short-{L}.png"))

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


# ── Historical DIN plates (before 1994): white face, black border, no euroband ──
def din_plate(w, h, border, radius, name):
    SS = 4
    big = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    bd = ImageDraw.Draw(big)
    bd.rounded_rectangle([0, 0, w * SS - 1, h * SS - 1], radius=radius * SS, fill=(0, 0, 0, 255))
    fm = Image.new("L", big.size, 0)
    ImageDraw.Draw(fm).rounded_rectangle([border * SS, border * SS, (w - border) * SS, (h - border) * SS], radius=max(4, radius - border) * SS, fill=255)
    grad = Image.new("RGBA", big.size, (255, 255, 255, 255))
    gd = ImageDraw.Draw(grad)
    for y in range(border * SS, (h - border) * SS + 1):
        t = (y - border * SS) / ((h - 2 * border) * SS)
        v = round(255 - 14 * t)
        gd.line([(0, y), (big.size[0], y)], fill=(v, v, v, 255))
    big.paste(grad, (0, 0), fm)
    ImageDraw.Draw(big).rounded_rectangle([border * SS, border * SS + 2 * SS, (w - border) * SS - 2 * SS, (h - border) * SS - 2 * SS], radius=max(4, radius - border - 2) * SS, outline=(222, 222, 222, 255), width=2 * SS)
    im = big.resize((w, h), Image.LANCZOS)
    n = Image.effect_noise((w, h), 14).point(lambda p: max(0, min(255, p // 5)))
    fr = ImageChops.add(im.convert("RGB"), Image.merge("RGB", (n, n, n)), 1, -25)
    im.paste(fr, (0, 0), fm.resize((w, h), Image.LANCZOS))
    im.save(os.path.join(OUT, name))
din_plate(1920, 390, 14, 36, "din.png")
din_plate(960, 600, 14, 52, "din-two.png")
din_plate(1000, 500, 14, 44, "din-us.png")
# the dash between district and letters
dash = Image.new("RGBA", (200, 40), (0, 0, 0, 0))
ImageDraw.Draw(dash).rounded_rectangle([0, 0, 199, 39], radius=4, fill=(17, 17, 17, 255))
dash.save(os.path.join(OUT, "dash.png"))
print("din ok")


# ── 5-day (short-term) plates: white face, no euroband, yellow strip with the expiry date at the right ──
YEL = (250, 184, 0, 255)
def transit_plate(w, h, border, radius, name, box):
    base = Image.open(os.path.join(OUT, name.replace("transit", "din"))).convert("RGBA")
    ov = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rectangle(box, fill=YEL)
    face_only = Image.new("L", base.size, 0)
    ImageDraw.Draw(face_only).rounded_rectangle([border + 2, border + 2, w - border - 3, h - border - 3], radius=max(4, radius - border - 2), fill=255)
    base.paste(ov, (0, 0), ImageChops.multiply(ov.getchannel("A"), face_only))
    base.save(os.path.join(OUT, name))
transit_plate(1920, 390, 14, 36, "transit.png", [1700, 0, 1920, 390])
transit_plate(960, 600, 14, 52, "transit-two.png", [770, 0, 960, 310])
transit_plate(1000, 500, 14, 44, "transit-us.png", [830, 0, 1000, 230])
print("transit ok")


# ── Regular two-row / US-size / motorcycle plates (euroband top-left only, stickers at fixed spots) ──
BAND = src.crop((14, 16, 152, 374))                                 # the euroband from the photo (stars + D)
def regular_plate(w, h, radius, name, band_box, band=True):
    din_plate(w, h, 14, radius, name)
    im = Image.open(os.path.join(OUT, name)).convert("RGBA")
    if band:
        x0, y0, x1, y1 = band_box
        im.alpha_composite(BAND.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0))
    im.save(os.path.join(OUT, name))
regular_plate(1000, 590, 44, "us.png", (14, 14, 154, 291))
regular_plate(700, 500, 44, "two.png", (14, 14, 114, 244))
regular_plate(900, 1000, 56, "moto.png", (14, 14, 204, 454))
regular_plate(1100, 1000, 56, "moto-old.png", (14, 14, 201, 448))
print("regular ok")


# 5-day plates have a yellow strip, export plates the same in red
RED = (236, 58, 48, 255)
def strip_variant(out_name, base_name, box, col):
    base = Image.open(os.path.join(OUT, base_name)).convert("RGBA")
    w, h = base.size
    ov = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rectangle(box, fill=col)
    face_only = Image.new("L", base.size, 0)
    r = {1920: 36, 960: 52, 1000: 44}[w]
    ImageDraw.Draw(face_only).rounded_rectangle([16, 16, w - 17, h - 17], radius=r - 16, fill=255)
    base.paste(ov, (0, 0), ImageChops.multiply(ov.getchannel("A"), face_only))
    base.save(os.path.join(OUT, out_name))
strip_variant("export.png", "din.png", [1700, 0, 1920, 390], RED)
strip_variant("export-two.png", "din-two.png", [770, 0, 960, 310], RED)
strip_variant("export-us.png", "din-us.png", [830, 0, 1000, 230], RED)
print("export ok")


# ── Transferable (Wechselkennzeichen) plates: the plate plus a small plate at the right (inspection sticker + number) ──
from PIL import ImageFont
din_plate(1560, 390, 14, 36, "_tmp_main.png")
din_plate(330, 390, 14, 36, "_tmp_small.png")
main = Image.open(os.path.join(OUT, "_tmp_main.png")).convert("RGBA")
main.alpha_composite(src.crop((14, 16, 152, 374)), (14, 16))
small = Image.open(os.path.join(OUT, "_tmp_small.png")).convert("RGBA")
tw = Image.new("RGBA", (1920, 390), (0, 0, 0, 0))
tw.alpha_composite(main, (0, 0)); tw.alpha_composite(small, (1590, 0))
tw.save(os.path.join(OUT, "transferable.png"))
os.remove(os.path.join(OUT, "_tmp_main.png")); os.remove(os.path.join(OUT, "_tmp_small.png"))
# the small "W" that stands where the inspection sticker would be
wimg = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
f = ImageFont.truetype(os.path.join(ROOT, "assets/fonts/D-DIN.ttf"), 150)
ImageDraw.Draw(wimg).text((80, 80), "W", fill=(17, 17, 17, 255), font=f, anchor="mm")
wimg.save(os.path.join(OUT, "w.png"))
print("transferable ok")


# transferable two-row / US / motorcycle: the plate plus a small plate at the right
def with_small(main_name, small_w, out_name, gap=20):
    m = Image.open(os.path.join(OUT, main_name)).convert("RGBA")
    din_plate(small_w, m.size[1], 14, 40, "_tmp_small.png")
    sm = Image.open(os.path.join(OUT, "_tmp_small.png")).convert("RGBA")
    c = Image.new("RGBA", (m.size[0] + gap + small_w, m.size[1]), (0, 0, 0, 0))
    c.alpha_composite(m, (0, 0)); c.alpha_composite(sm, (m.size[0] + gap, 0))
    c.save(os.path.join(OUT, out_name)); os.remove(os.path.join(OUT, "_tmp_small.png"))
with_small("two.png", 200, "transferable-two.png")
with_small("us.png", 200, "transferable-us.png")
with_small("moto.png", 240, "transferable-moto.png")
print("transferable variants ok")
