"""Builds the region maps of the other countries: public/data/<country>-regions.json  (same format as germany-districts.json).

  python scripts/build-region-maps.py <ne_10m_admin_1_states_provinces.geojson> <austria-bezirke.geojson>

Sources: Natural Earth admin-1 (public domain) for Czechia, Bulgaria, Croatia and Albania;
Austrian districts (Bezirke) from github.com/ginseng666/GeoJSON-TopoJSON-Austria (simplified-95, 2021, Statistik Austria data, CC BY 4.0).
Each unit lists the plate codes that belong to it (the code → unit tables below come from the upload forms' region lists).
"""
import json, math, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data")
NE = json.load(open(sys.argv[1], encoding="utf8"))
AT = json.load(open(sys.argv[2], encoding="utf8"))

def fix_u(t):
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), t)

def ts(path):
    return open(os.path.join(ROOT, path), encoding="utf8").read()

# ── geometry helpers ──
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
    if best > eps: return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]

def polys_of(g):
    return g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]

def build(country, units, size=700.0, eps=0.7, min_area=2.0):
    """units: [(name, [plate codes], geometry)]"""
    lons = [p[0] for _, _, g in units for poly in polys_of(g) for ring in poly for p in ring]
    lats = [p[1] for _, _, g in units for poly in polys_of(g) for ring in poly for p in ring]
    lon0, lat1 = min(lons), max(lats)
    k = math.cos(math.radians((min(lats) + max(lats)) / 2))
    scale = size / max((max(lons) - lon0) * k, lat1 - min(lats))
    maxx = maxy = 0.0
    areas = []
    for name, codes, g in units:
        path = []
        for poly in polys_of(g):
            for ring in poly:
                pts = [((lon - lon0) * k * scale, (lat1 - lat) * scale) for lon, lat in ring]
                if abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2 < min_area: continue
                s = dp(pts, eps)
                if len(s) < 4: continue
                maxx = max(maxx, max(x for x, _ in s)); maxy = max(maxy, max(y for _, y in s))
                path.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in s[:-1]) + "Z")
        areas.append({"n": name, "c": codes, "d": "".join(path)})
    out = {"w": math.ceil(maxx) + 2, "h": math.ceil(maxy) + 2, "areas": areas}
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, f"{country}-regions.json")
    json.dump(out, open(p, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    unmapped = [a["n"] for a in areas if not a["c"]]
    print(f"{country}: {len(areas)} areas, {os.path.getsize(p) // 1024} KB, viewBox {out['w']}x{out['h']}" + (f", without codes: {unmapped}" if unmapped else ""))

def ne(adm0):
    return [f for f in NE["features"] if f["properties"]["adm0_a3"] == adm0]

# ── Czechia: 14 regions, plate letters + the sport/oldtimer numbers + the 1960 two-letter codes ──
CZ = {
    "Prague": ["A", "X", "01"], "Jihomoravský": ["B", "02"], "Jihočeský": ["C", "03"], "Pardubický": ["E", "04"], "Královéhradecký": ["H", "05"],
    "Vysočina": ["J", "06"], "Karlovarský": ["K", "07"], "Liberecký": ["L", "08"], "Olomoucký": ["M", "09"], "Plzeňský": ["P", "10"],
    "Středočeský": ["S", "11"], "Moravskoslezský": ["T", "12"], "Ústecký": ["U", "13"], "Zlínský": ["Z", "14"],
}
CZ_NAME = {"Prague": "Prague", "Capital City of Prague": "Prague", "South Moravian Region": "Jihomoravský", "South Bohemian Region": "Jihočeský", "Pardubice Region": "Pardubický",
           "Hradec Králové Region": "Královéhradecký", "Vysočina Region": "Vysočina", "Karlovy Vary Region": "Karlovarský", "Liberec Region": "Liberecký", "Olomouc Region": "Olomoucký",
           "Plzeň Region": "Plzeňský", "Central Bohemian Region": "Středočeský", "Moravian-Silesian Region": "Moravskoslezský", "Ústí nad Labem Region": "Ústecký", "Zlín Region": "Zlínský"}
for code, name in re.findall(r'code:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)"', ts("app/lib/czechData.ts")):
    k = CZ_NAME.get(name)
    if k and code not in CZ[k]: CZ[k].append(code)
build("czech", [(f["properties"]["name"], CZ.get(f["properties"]["name"], []), f["geometry"]) for f in ne("CZE")], eps=0.6)

# ── Bulgaria: the code → province table of the upload form ──
BG_NAME = {"Khaskovo Province": "Haskovo", "Sofia City": "Grad Sofiya", "Sofia Province": "Sofia"}
bg = {}
for code, prov in re.findall(r'code:\s*"([^"]+)",\s*province:\s*"([^"]+)"', ts("app/lib/bulgariaData.ts")):
    if "Province" not in prov and prov != "Sofia City": continue
    bg.setdefault(BG_NAME.get(prov, prov.replace(" Province", "")), []).append(code)
build("bulgaria", [(f["properties"]["name"], bg.get(f["properties"]["name"], []), f["geometry"]) for f in ne("BGR")], eps=0.6)

# ── Croatia: plate city → county ──
HR = {
    "Bjelovarsko-bilogorska": ["BJ", "DA"], "Osjecko-Baranjska": ["BM", "DJ", "NA", "OS"], "Medimurska": ["ČK"], "Primorsko-Goranska": ["DE", "RI"],
    "Dubrovacko-Neretvanska": ["DU"], "Licko-Senjska": ["GS"], "Splitsko-Dalmatinska": ["IM", "MA", "ST"], "Karlovacka": ["KA", "OG"],
    "Koprivničko-Križevačka": ["KC", "KŽ"], "Krapinsko-Zagorska": ["KR"], "Sisacko-Moslavacka": ["KT", "SK"], "Brodsko-Posavska": ["NG", "SB"],
    "Viroviticko-Podravska": ["PS", "SL", "VT"], "Istarska": ["PU"], "Šibensko-Kninska": ["ŠI"], "Vukovarsko-Srijemska": ["VK", "VU", "ŽU"],
    "Varaždinska": ["VŽ"], "Zadarska": ["ZD"], "Grad Zagreb": ["ZG"], "Zagrebacka": ["ZG"],
}
hr_units = []
for f in ne("HRV"):
    p = f["properties"]
    codes = HR.get(p["name"], [])
    if p["name"] == "Brodsko-Posavska" and p.get("iso_3166_2") == "HR-11":      # the duplicate name is the Požega-Slavonia county
        codes = ["PŽ"]; name = "Požeško-slavonska"
    else:
        name = p["name"]
    hr_units.append((name, codes, f["geometry"]))
build("croatia", hr_units, eps=0.6)

# ── Albania: plate district → county ──
AL = {
    "Tiranë": ["TR", "KJ"], "Durrës": ["DR", "KR"], "Elbasan": ["EL", "GR", "LB", "PE"], "Fier": ["FR", "LU", "MK"], "Berat": ["BR", "KV", "SK"],
    "Vlorë": ["VL", "DL", "SR"], "Gjirokastër": ["GJ", "PR", "TP"], "Korçë": ["KO", "DV", "ER", "PG"], "Dibër": ["DI", "BZ", "MT"],
    "Lezhë": ["LE", "LA", "MR"], "Shkodër": ["SH", "MA", "PU"], "Kukës": ["KU", "BC", "HS"],
}
build("albania", [(f["properties"]["name"], AL.get(f["properties"]["name"], []), f["geometry"]) for f in ne("ALB")], eps=0.6)

# ── Austria: districts (Bezirke) ──
at_by = {}
for f in AT["features"]:
    n = f["properties"]["name"]
    if n.startswith("Wien ") : continue                        # one polygon for Vienna
    at_by[n] = f["geometry"]
AT_MAP = {                                                                       # plate code → district polygon(s)
    "AM": ["Amstetten"], "B": ["Bregenz"], "BA": ["Liezen"], "BL": ["Bruck an der Leitha"], "BM": ["Bruck-Mürzzuschlag"], "BN": ["Baden"], "BR": ["Braunau"], "BZ": ["Bludenz"],
    "DL": ["Deutschlandsberg"], "DO": ["Dornbirn"], "E": ["Eisenstadt(Stadt)", "Rust(Stadt)"], "EF": ["Eferding"], "EU": ["Eisenstadt-Umgebung"], "FB": ["Südoststeiermark"],
    "FE": ["Feldkirchen"], "FF": ["Hartberg-Fürstenfeld"], "FK": ["Feldkirch"], "FR": ["Freistadt"], "G": ["Graz(Stadt)"], "GB": ["Liezen"], "GD": ["Gmünd"], "GF": ["Gänserndorf"],
    "GM": ["Gmunden"], "GR": ["Grieskirchen"], "GS": ["Güssing"], "GU": ["Graz-Umgebung"], "HA": ["Hallein"], "HB": ["Hartberg-Fürstenfeld"], "HE": ["Hermagor"], "HF": ["Hartberg-Fürstenfeld"],
    "HL": ["Hollabrunn"], "HO": ["Horn"], "I": ["Innsbruck-Stadt"], "IL": ["Innsbruck-Land"], "IM": ["Imst"], "JE": ["Jennersdorf"], "JO": ["Sankt Johann im Pongau"], "JU": ["Murtal"],
    "K": ["Klagenfurt Stadt"], "KB": ["Kitzbühel"], "KF": ["Murtal"], "KG": ["Tulln"], "KI": ["Kirchdorf"], "KL": ["Klagenfurt Land"], "KO": ["Korneuburg"], "KR": ["Krems(Land)"],
    "KS": ["Krems an der Donau(Stadt)"], "KU": ["Kufstein"], "L": ["Stadt Linz"], "LA": ["Landeck"], "LB": ["Leibnitz"], "LE": ["Leoben"], "LF": ["Lilienfeld"], "LI": ["Liezen"],
    "LL": ["Linz-Land"], "LN": ["Leoben"], "LZ": ["Lienz"], "MA": ["Mattersburg"], "MD": ["Mödling"], "ME": ["Melk"], "MI": ["Mistelbach"], "MT": ["Murtal"], "MU": ["Murau"],
    "MZ": ["Bruck-Mürzzuschlag"], "ND": ["Neusiedl am See"], "NK": ["Neunkirchen"], "OP": ["Oberpullendorf"], "OW": ["Oberwart"], "P": ["Sankt Pölten(Stadt)"], "PE": ["Perg"],
    "PL": ["Sankt Pölten(Land)"], "RA": ["Südoststeiermark"], "RE": ["Reutte"], "RI": ["Ried"], "RO": ["Rohrbach"], "S": ["Salzburg(Stadt)"], "SB": ["Scheibbs"], "SD": ["Schärding"],
    "SE": ["Steyr-Land"], "SL": ["Salzburg-Umgebung"], "SO": ["Südoststeiermark"], "SP": ["Spittal an der Drau"], "SR": ["Stadt Steyr"], "SV": ["Sankt Veit an der Glan"],
    "SW": ["Bruck an der Leitha"], "SZ": ["Schwaz"], "TA": ["Tamsweg"], "TU": ["Tulln"], "UU": ["Urfahr-Umgebung"], "VB": ["Vöcklabruck"], "VI": ["Villach Stadt"], "VK": ["Völkermarkt"],
    "VL": ["Villach Land"], "VO": ["Voitsberg"], "W": ["Wien(Stadt)"], "WB": ["Wiener Neustadt(Land)"], "WE": ["Stadt Wels"], "WL": ["Wels-Land"], "WN": ["Wiener Neustadt(Stadt)"],
    "WO": ["Wolfsberg"], "WT": ["Waidhofen an der Thaya"], "WU": ["Korneuburg"], "WY": ["Waidhofen an der Ybbs(Stadt)"], "WZ": ["Weiz"], "ZE": ["Zell am See"], "ZT": ["Zwettl"],
}
codes_of = {}
for code, polys in AT_MAP.items():
    for p in polys:
        assert p in at_by, (code, p)
        codes_of.setdefault(p, []).append(code)
build("austria", [(n, codes_of.get(n, []), g) for n, g in at_by.items()], eps=0.45, min_area=1.0)
