"""Berlin's own seals (supplied photos, assets/germany-seals/BE*.png), trimmed and enlarged to the seal size.

  python scripts/build-germany-berlin-seals.py

BE = normal seal (Bundeshauptstadt), BE-export = export plates (red), BE-temp = short-term plates (blue).
Run after scripts/build-germany-seals.cjs (this replaces the drawn BE seal).
"""
from PIL import Image
import os
ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public/plates/germany/seals")
for name in ("BE", "BE-export", "BE-temp"):
    im = Image.open(os.path.join(ROOT, f"assets/germany-seals/{name}.png")).convert("RGBA")
    box = im.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox()
    im = im.crop(box)
    side = max(im.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0)); sq.paste(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2))
    sq.resize((316, 316), Image.LANCZOS).save(os.path.join(OUT, f"{name}.png"))
print("ok")
