// ─────────────────────────────────────────────────────────────────────────────
//  PlateVault — Austria plate data
// ─────────────────────────────────────────────────────────────────────────────

export type AustriaPreselect = { code: string; name: string };

// ─── PreSelect 1 — District codes ────────────────────────────────────────────────
export const AUSTRIA_PRESELECT_1: AustriaPreselect[] = [
  { code: "AM", name: "Amstetten District" },
  { code: "B",  name: "Bregenz District" },
  { code: "BA", name: "Bad Aussee" },
  { code: "BL", name: "Bruck an der Leitha" },
  { code: "BM", name: "Bruck-Mürzzuschlag" },
  { code: "BN", name: "Baden" },
  { code: "BR", name: "Braunau am Inn" },
  { code: "BZ", name: "Bludenz" },
  { code: "DL", name: "Deutschlandsberg" },
  { code: "DO", name: "Dornbirn" },
  { code: "E",  name: "Eisenstadt & Rust" },
  { code: "EF", name: "Eferding" },
  { code: "EU", name: "Eisenstadt-Umgebung" },
  { code: "FB", name: "Feldbach (former)" },
  { code: "FE", name: "Feldkirchen" },
  { code: "FF", name: "Fürstenfeld (former)" },
  { code: "FK", name: "Feldkirch" },
  { code: "FR", name: "Freistadt" },
  { code: "G",  name: "Graz" },
  { code: "GB", name: "Gröbming" },
  { code: "GD", name: "Gmünd" },
  { code: "GF", name: "Gänserndorf" },
  { code: "GM", name: "Gmunden" },
  { code: "GR", name: "Grieskirchen" },
  { code: "GS", name: "Güssing" },
  { code: "GU", name: "Graz-Umgebung" },
  { code: "HA", name: "Hallein" },
  { code: "HB", name: "Hartberg (former)" },
  { code: "HE", name: "Hermagor" },
  { code: "HF", name: "Hartberg-Fürstenfeld" },
  { code: "HL", name: "Hollabrunn" },
  { code: "HO", name: "Horn" },
  { code: "I",  name: "Innsbruck" },
  { code: "IL", name: "Innsbruck-Land" },
  { code: "IM", name: "Imst" },
  { code: "JE", name: "Jennersdorf" },
  { code: "JO", name: "Sankt Johann im Pongau" },
  { code: "JU", name: "Judenburg (former)" },
  { code: "K",  name: "Klagenfurt" },
  { code: "KB", name: "Kitzbühel" },
  { code: "KF", name: "Knittelfeld (former)" },
  { code: "KG", name: "Klosterneuburg" },
  { code: "KI", name: "Kirchdorf an der Krems" },
  { code: "KL", name: "Klagenfurt-Land" },
  { code: "KO", name: "Korneuburg" },
  { code: "KR", name: "Krems-Land" },
  { code: "KS", name: "Krems an der Donau" },
  { code: "KU", name: "Kufstein" },
  { code: "L",  name: "Linz" },
  { code: "LA", name: "Landeck" },
  { code: "LB", name: "Leibnitz" },
  { code: "LE", name: "Leoben" },
  { code: "LF", name: "Lilienfeld" },
  { code: "LI", name: "Liezen" },
  { code: "LL", name: "Linz-Land" },
  { code: "LN", name: "Leoben-Land" },
  { code: "LZ", name: "Lienz" },
  { code: "MA", name: "Mattersburg" },
  { code: "MD", name: "Mödling" },
  { code: "ME", name: "Melk" },
  { code: "MI", name: "Mistelbach" },
  { code: "MT", name: "Murtal" },
  { code: "MU", name: "Murau" },
  { code: "MZ", name: "Mürzzuschlag (former)" },
  { code: "ND", name: "Neusiedl am See" },
  { code: "NK", name: "Neunkirchen" },
  { code: "OP", name: "Oberpullendorf" },
  { code: "OW", name: "Oberwart" },
  { code: "P",  name: "Sankt Pölten" },
  { code: "PE", name: "Perg" },
  { code: "PL", name: "Sankt Pölten-Land" },
  { code: "RA", name: "Radkersburg (former)" },
  { code: "RE", name: "Reutte" },
  { code: "RI", name: "Ried im Innkreis" },
  { code: "RO", name: "Rohrbach" },
  { code: "S",  name: "Salzburg" },
  { code: "SB", name: "Scheibbs" },
  { code: "SD", name: "Schärding" },
  { code: "SE", name: "Steyr-Land" },
  { code: "SL", name: "Salzburg-Umgebung" },
  { code: "SO", name: "Südoststeiermark" },
  { code: "SP", name: "Spittal an der Drau" },
  { code: "SR", name: "Steyr" },
  { code: "SV", name: "Sankt Veit an der Glan" },
  { code: "SW", name: "Schwechat" },
  { code: "SZ", name: "Schwaz" },
  { code: "TA", name: "Tamsweg" },
  { code: "TU", name: "Tulln" },
  { code: "UU", name: "Urfahr-Umgebung" },
  { code: "VB", name: "Vöcklabruck" },
  { code: "VI", name: "Villach" },
  { code: "VK", name: "Völkermarkt" },
  { code: "VL", name: "Villach-Land" },
  { code: "VO", name: "Voitsberg" },
  { code: "W",  name: "Wien" },
  { code: "WB", name: "Wiener Neustadt-Land" },
  { code: "WE", name: "Wels" },
  { code: "WL", name: "Wels-Land" },
  { code: "WN", name: "Wiener Neustadt" },
  { code: "WO", name: "Wolfsberg" },
  { code: "WT", name: "Waidhofen an der Thaya" },
  { code: "WU", name: "Wien-Umgebung" },
  { code: "WY", name: "Waidhofen an der Ybbs" },
  { code: "WZ", name: "Weiz" },
  { code: "ZE", name: "Zell am See" },
  { code: "ZT", name: "Zwettl" },
];

// ─── PreSelect 2 — Official services / consulates ───────────────────────────────────
export const AUSTRIA_PRESELECT_2: AustriaPreselect[] = [
  { code: "BD", name: "Bus Service" },
  { code: "BH", name: "Federal Army" },
  { code: "BP", name: "Federal Police" },
  { code: "FV", name: "Financial Administration" },
  { code: "FW", name: "Fire Department" },
  { code: "JW", name: "Justice Police" },
  { code: "PT", name: "Post" },
];

// ─── PreSelect 3 — Federal states (1947 year system) ──────────────────────────────
export const AUSTRIA_PRESELECT_3: AustriaPreselect[] = [
  { code: "B",  name: "Burgenland" },
  { code: "G",  name: "Graz" },
  { code: "K",  name: "Kärnten (Carinthia)" },
  { code: "L",  name: "Linz" },
  { code: "N",  name: "Niederösterreich" },
  { code: "O",  name: "Oberösterreich" },
  { code: "S",  name: "Salzburg" },
  { code: "St", name: "Steiermark (Styria)" },
  { code: "T",  name: "Tirol (Tyrol)" },
  { code: "V",  name: "Vorarlberg" },
  { code: "W",  name: "Wien" },
];

// ─── Lookup helpers ────────────────────────────────────────────────────────────────────
const BY1 = new Map(AUSTRIA_PRESELECT_1.map((r) => [r.code, r]));
const BY2 = new Map(AUSTRIA_PRESELECT_2.map((r) => [r.code, r]));
const BY3 = new Map(AUSTRIA_PRESELECT_3.map((r) => [r.code, r]));
export function getAustriaPreselect1(code: string) { return BY1.get(code); }
export function getAustriaPreselect2(code: string) { return BY2.get(code); }
export function getAustriaPreselect3(code: string) { return BY3.get(code); }

// ─── Plate formats ───────────────────────────────────────────────────────────────────────
export const AT_FORMAT_LABELS: Record<string, string> = {
  "single-euroband":    "Single-row plate with euroband",
  "double-euroband":    "Two-row plate with euroband",
  "single-no-euroband": "Single-row plate without euroband",
  "double-no-euroband": "Two-row plate without euroband",
  "repeater":           "Repeater plates (red)",
  "moped":              "Mopeds",
  "moped-green":        "Mopeds (green characters)",
};

export type AustriaCategoryId =
  | "regular" | "electric" | "vanity" | "electric-vanity" | "official"
  | "export"  | "provisional" | "1947"   | "dealer"
  | "dealer-1947" | "diplomatic";

export const AUSTRIA_CATEGORIES: { id: AustriaCategoryId; label: string }[] = [
  { id: "regular",          label: "Regular" },
  { id: "electric",         label: "Electric Vehicle" },
  { id: "vanity",           label: "Vanity" },
  { id: "electric-vanity",  label: "Electric Vehicle Vanity" },
  { id: "official",    label: "Official Services & Consulates" },
  { id: "export",      label: "Export Transit" },
  { id: "provisional", label: "Provisional" },
  { id: "1947",        label: "1947 Year System" },
  { id: "dealer",      label: "Dealer" },
  { id: "dealer-1947", label: "Dealer (1947 Year System)" },
  { id: "diplomatic",  label: "Diplomatic" },
];

const ALL_FMT = ["single-euroband","double-euroband","single-no-euroband","double-no-euroband","repeater","moped","moped-green"] as const;
const EXP_FMT = ["single-no-euroband","double-no-euroband"] as const;
const NEB_FMT = ["single-no-euroband","double-no-euroband","moped"] as const;

export const AUSTRIA_FORMATS_FOR: Record<AustriaCategoryId, readonly string[]> = {
  regular:          ALL_FMT,
  electric:         ALL_FMT,
  vanity:           ALL_FMT,
  "electric-vanity": ALL_FMT,
  official:         ALL_FMT,
  diplomatic:    ALL_FMT,
  export:        EXP_FMT,
  provisional:   NEB_FMT,
  "1947":        NEB_FMT,
  dealer:        NEB_FMT,
  "dealer-1947": NEB_FMT,
};

// Plate type labels: at-{category}-{format} -> human-readable
export const AUSTRIA_PLATE_TYPE_LABELS: Record<string, string> = {};
for (const cat of AUSTRIA_CATEGORIES) {
  for (const fmt of AUSTRIA_FORMATS_FOR[cat.id]) {
    AUSTRIA_PLATE_TYPE_LABELS[`at-${cat.id}-${fmt}`] =
      `${cat.label} -- ${AT_FORMAT_LABELS[fmt]}`;
  }
}
