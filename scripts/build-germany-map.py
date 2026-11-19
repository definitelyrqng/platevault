"""Builds public/data/germany-districts.json: the German districts (Kreise) with their plate codes, as simplified SVG paths.

  python scripts/build-germany-map.py <kfz250.json>

Source: BKG "KFZ-Kennzeichen 1:250 000" (WFS https://sg.geodatenzentrum.de/wfs_kfz250, layer kfz:kfz250, JSON, EPSG:4326).
  curl -L "https://sg.geodatenzentrum.de/wfs_kfz250?service=WFS&version=2.0.0&request=GetFeature&typeNames=kfz:kfz250&outputFormat=application/json&srsName=EPSG:4326&count=2000" -o kfz250.json
(© GeoBasis-DE / BKG, Datenlizenz Deutschland – Namensnennung 2.0.) The file is ISO-8859-1 text.
"""
import json, math, os, sys

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "germany-districts.json")
EPS = 0.5           # simplification tolerance in map units (1 unit = 0.01° of latitude)
MIN_AREA = 1.2      # drop islands smaller than this (map units²)

d = json.loads(open(SRC, "rb").read().decode("latin-1"))
LAT0, LON0 = 55.1, 5.8
K = math.cos(math.radians(51.0))

def proj(lon, lat):
    return ((lon - LON0) * K * 100.0, (LAT0 - lat) * 100.0)

def dp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    best, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        dist = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L if L else math.hypot(x - x1, y - y1)
        if dist > best: best, idx = dist, i
    if best > eps:
        return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]

def area(pts):
    return abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2

areas = []
maxx = maxy = 0.0
for f in d["features"]:
    p = f["properties"]
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    path = []
    for poly in polys:
        for ri, ring in enumerate(poly):
            pts = [proj(lon, lat) for lon, lat in ring]
            if area(pts) < MIN_AREA: continue
            s = dp(pts, EPS)
            if len(s) < 4: continue
            maxx = max(maxx, max(x for x, _ in s)); maxy = max(maxy, max(y for _, y in s))
            path.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in s[:-1]) + "Z")
    def fix(c):                                    # the codes are UTF-8 inside the ISO-8859-1 file (AÖ, MÜ …)
        try: return c.encode("latin-1").decode("utf-8")
        except UnicodeError: return c
    codes = [fix(c) for c in (p.get("kfz") or "").split() if c]
    areas.append({"n": fix(p["name"]), "c": codes, "s": p["ars"][:2], "k": "stadt" if "Kreisfreie" in (p.get("oba") or "") else "kreis", "d": "".join(path)})

out = {"w": math.ceil(maxx) + 2, "h": math.ceil(maxy) + 2, "areas": areas}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(len(areas), "areas,", os.path.getsize(OUT) // 1024, "KB, viewBox", out["w"], out["h"])
