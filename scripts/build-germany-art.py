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

# ── flat vector plates drawn after assets/germany-template.png (the 520 mm plate: black border, flat white face, blue euroband) ──
from PIL import ImageChops
TPL = Image.open(os.path.join(ROOT, "assets/germany-template.png")).convert("RGBA")
BLUE = (0, 51, 153)
BORDER = 18
def _band_overlay():
    """The stars and the D of the template's euroband as an overlay (alpha = how far a pixel is from the blue)."""
    c = TPL.crop((40, 37, 209, 402)); px = c.load()
    ov = Image.new("RGBA", c.size, (0, 0, 0, 0)); op = ov.load()
    for y in range(c.size[1]):
        for x in range(c.size[0]):
            r, g, b, a = px[x, y]
            al = r / 255
            if al < 0.02 or a < 255: continue
            col = [max(0, min(255, round((v - (1 - al) * bv) / al))) for v, bv in zip((r, g, b), BLUE)]
            op[x, y] = (col[0], col[1], col[2], round(al * 255))
    return ov
BAND_OV = _band_overlay()
def flat_plate(w, h, radius, name, band=None, stretch=False, border=BORDER, edge=(0, 0, 0, 255)):
    SS = 4
    big = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    ImageDraw.Draw(big).rounded_rectangle([0, 0, w * SS - 1, h * SS - 1], radius=radius * SS, fill=edge)
    fm = Image.new("L", big.size, 0)
    ImageDraw.Draw(fm).rounded_rectangle([border * SS, border * SS, (w - border) * SS - 1, (h - border) * SS - 1], radius=max(4, radius - border) * SS, fill=255)
    big.paste(Image.new("RGBA", big.size, (255, 255, 255, 255)), (0, 0), fm)
    if band:
        x0, y0, x1, y1 = band
        bm = Image.new("L", big.size, 0)
        ImageDraw.Draw(bm).rectangle([x0 * SS, y0 * SS, x1 * SS - 1, y1 * SS - 1], fill=255)
        big.paste(Image.new("RGBA", big.size, BLUE + (255,)), (0, 0), ImageChops.multiply(fm, bm))
        bw, bh = (x1 - x0) * SS, (y1 - y0) * SS
        if stretch: ow, oh = bw, bh
        else:
            k = min(bw / BAND_OV.size[0], bh / BAND_OV.size[1]); ow, oh = round(BAND_OV.size[0] * k), round(BAND_OV.size[1] * k)
        ov = BAND_OV.resize((ow, oh), Image.LANCZOS)
        big.alpha_composite(ov, (x0 * SS + (bw - ow) // 2, y0 * SS + (bh - oh) // 2))
    im = big.resize((w, h), Image.LANCZOS)
    im.save(os.path.join(OUT, name))
    return im
face = flat_plate(W, H, 38, "single.png", band=(BORDER, BORDER, 190, H - BORDER), stretch=True)

# seasonal plates: the plate with a short line between the two month numbers at the right end
season = face.copy()
ImageDraw.Draw(season).rectangle([1745, 185, 1880, 194], fill=(17, 17, 17, 255))
season.save(os.path.join(OUT, "season.png"))

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
def din_plate(w, h, border, radius, name, band=None):
    return flat_plate(w, h, radius, name, band)
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
    border = BORDER
    base = Image.open(os.path.join(OUT, name.replace("transit", "din"))).convert("RGBA")
    ov = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rectangle(box, fill=YEL)
    face_only = Image.new("L", base.size, 0)
    ImageDraw.Draw(face_only).rounded_rectangle([border, border, w - border - 1, h - border - 1], radius=max(4, radius - border), fill=255)
    base.paste(ov, (0, 0), ImageChops.multiply(ov.getchannel("A"), face_only))
    base.save(os.path.join(OUT, name))
transit_plate(1920, 390, 14, 36, "transit.png", [1700, 0, 1920, 390])
transit_plate(960, 600, 14, 52, "transit-two.png", [770, 0, 960, 310])
transit_plate(1000, 500, 14, 44, "transit-us.png", [830, 0, 1000, 230])
print("transit ok")


# ── Regular two-row / US-size / motorcycle plates (euroband top-left only, stickers at fixed spots) ──
def regular_plate(w, h, radius, name, band_box):
    flat_plate(w, h, radius, name, band_box)
regular_plate(1000, 590, 44, "us.png", (18, 18, 160, 294))
regular_plate(700, 500, 44, "two.png", (18, 18, 120, 246))
regular_plate(900, 1000, 56, "moto.png", (18, 18, 208, 458))
regular_plate(1100, 1000, 56, "moto-old.png", (18, 18, 205, 452))
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
    ImageDraw.Draw(face_only).rounded_rectangle([BORDER, BORDER, w - BORDER - 1, h - BORDER - 1], radius=r - BORDER, fill=255)
    base.paste(ov, (0, 0), ImageChops.multiply(ov.getchannel("A"), face_only))
    base.save(os.path.join(OUT, out_name))
strip_variant("export.png", "din.png", [1700, 0, 1920, 390], RED)
strip_variant("export-two.png", "din-two.png", [770, 0, 960, 310], RED)
strip_variant("export-us.png", "din-us.png", [830, 0, 1000, 230], RED)
print("export ok")


# ── Transferable (Wechselkennzeichen) plates: the plate plus a small plate at the right (inspection sticker + number) ──
from PIL import ImageFont
din_plate(330, 390, 14, 36, "_tmp_small.png")
main = Image.new("RGBA", (1560, H), (0, 0, 0, 0))
main.paste(face.crop((0, 0, 1000, H)), (0, 0)); main.paste(face.crop((1360, 0, W, H)), (1000, 0))
small = Image.open(os.path.join(OUT, "_tmp_small.png")).convert("RGBA")
tw = Image.new("RGBA", (1920, 390), (0, 0, 0, 0))
tw.alpha_composite(main, (0, 0)); tw.alpha_composite(small, (1590, 0))
tw.save(os.path.join(OUT, "transferable.png"))
os.remove(os.path.join(OUT, "_tmp_small.png"))
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


# seasonal plates (two-row / US / motorcycle): a line between the two month numbers at the right end of the upper row (same formula as plateLayout.ts)
for name, (x0, y0, x1, y1) in {"moto-old": (275, 100, 990, 470)}.items():
    im = Image.open(os.path.join(OUT, name + ".png")).convert("RGBA")
    h = y1 - y0; cw = round(h * 0.42); t = max(5, round(h * 0.04)); cy = (y0 + y1) // 2
    ImageDraw.Draw(im).rectangle([x1 - cw, cy - t // 2, x1, cy + t // 2], fill=(17, 17, 17, 255))
    im.save(os.path.join(OUT, f"season-{name}.png"))
im = Image.open(os.path.join(OUT, "us.png")).convert("RGBA")
ImageDraw.Draw(im).rectangle([845, 421, 935, 429], fill=(17, 17, 17, 255))
im.save(os.path.join(OUT, "season-us.png"))
im = Image.open(os.path.join(OUT, "two.png")).convert("RGBA")
ImageDraw.Draw(im).rectangle([605, 143, 690, 155], fill=(17, 17, 17, 255))
im.save(os.path.join(OUT, "season-two.png"))
im = Image.open(os.path.join(OUT, "moto.png")).convert("RGBA")
ImageDraw.Draw(im).rectangle([665, 485, 850, 501], fill=(17, 17, 17, 255))
im.save(os.path.join(OUT, "season-moto.png"))
print("season variants ok")


# red plates (dealer / test plates): red border and red lettering on the white face, the usual euroband
RB = 10
red_face = Image.new("RGBA", (1, 1))
for name, (w, h, r, band) in {"red": (1920, 390, 38, (RB, RB, 186, 390 - RB)), "red-two": (700, 500, 44, (RB, RB, 112, 240)), "red-us": (1000, 590, 44, (RB, RB, 154, 290)), "red-moto": (900, 1000, 56, (RB, RB, 200, 450))}.items():
    flat_plate(w, h, r, name + ".png", band, stretch=(name == "red"), border=RB, edge=(190, 30, 38, 255))
print("red ok")

# historical DIN red plates: red border, no euroband
for name, (w, h, r) in {"red-din": (1920, 390, 36), "red-din-two": (960, 600, 52), "red-din-us": (1000, 500, 44)}.items():
    flat_plate(w, h, r, name + ".png", None, border=RB, edge=(190, 30, 38, 255))
dot = Image.new("RGBA", (200, 200), (0, 0, 0, 0)); dd_ = ImageDraw.Draw(dot)
dd_.ellipse([2, 2, 197, 197], fill=(160, 40, 48, 255)); dd_.ellipse([14, 14, 185, 185], fill=(214, 70, 78, 255)); dd_.ellipse([40, 40, 160, 160], outline=(160, 40, 48, 255), width=5)
dot.save(os.path.join(OUT, "red-dot.png"))
rd = Image.new("RGBA", (200, 40), (0, 0, 0, 0)); ImageDraw.Draw(rd).rounded_rectangle([0, 0, 199, 39], radius=4, fill=(184, 31, 38, 255)); rd.save(os.path.join(OUT, "red-dash.png"))
print("red din ok")
