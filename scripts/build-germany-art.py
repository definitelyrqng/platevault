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
bd.rounded_rectangle([0, 0, W * SS - 1, H * SS - 1], radius=30 * SS, fill=(0, 0, 0, 255))
FX0, FY0, FX1, FY1 = 150, 16, 1904, 373
face_mask = Image.new("L", big.size, 0)
ImageDraw.Draw(face_mask).rounded_rectangle([FX0 * SS - 40 * SS, FY0 * SS, FX1 * SS, FY1 * SS], radius=15 * SS, fill=255)
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
din_plate(1920, 390, 14, 26, "din.png")
din_plate(960, 600, 14, 24, "din-two.png")
din_plate(1000, 500, 14, 24, "din-us.png")
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
transit_plate(1920, 390, 14, 26, "transit.png", [1700, 0, 1920, 390])
transit_plate(960, 600, 14, 24, "transit-two.png", [770, 0, 960, 310])
transit_plate(1000, 500, 14, 24, "transit-us.png", [800, 0, 1000, 260])
print("transit ok")
