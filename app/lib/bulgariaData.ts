// Bulgaria plate data

export type BulgariacategoryId =
  | "standard"
  | "motorcycle"
  | "military"
  | "vanity"
  | "temporary"
  | "diplomatic"
  | "foreign";

export const BULGARIA_REGIONS: { code: string; province: string }[] = [
  { code: "A",  province: "Burgas Province" },
  { code: "B",  province: "Varna Province" },
  { code: "BH", province: "Vidin Province" },
  { code: "BP", province: "Vratsa Province" },
  { code: "BT", province: "Veliko Tarnovo Province" },
  { code: "C",  province: "Sofia City" },
  { code: "CA", province: "Sofia City" },
  { code: "CB", province: "Sofia City" },
  { code: "CC", province: "Silistra Province" },
  { code: "CH", province: "Sliven Province" },
  { code: "CM", province: "Smolyan Province" },
  { code: "CO", province: "Sofia Province" },
  { code: "CT", province: "Stara Zagora Province" },
  { code: "E",  province: "Blagoevgrad Province" },
  { code: "EA", province: "Electric Vehicles (Sofia City)" },
  { code: "EB", province: "Gabrovo Province" },
  { code: "EH", province: "Pleven Province" },
  { code: "EM", province: "Electric Motorcycles" },
  { code: "H",  province: "Shumen Province" },
  { code: "K",  province: "Kardzhali Province" },
  { code: "KH", province: "Kyustendil Province" },
  { code: "M",  province: "Montana Province" },
  { code: "OB", province: "Lovech Province" },
  { code: "P",  province: "Ruse Province" },
  { code: "PA", province: "Pazardzhik Province" },
  { code: "PB", province: "Plovdiv Province" },
  { code: "PK", province: "Pernik Province" },
  { code: "PP", province: "Razgrad Province" },
  { code: "T",  province: "Targovishte Province" },
  { code: "TX", province: "Dobrich Province" },
  { code: "X",  province: "Khaskovo Province" },
  { code: "Y",  province: "Yambol Province" },
];

export const BULGARIA_CATEGORIES: {
  id: BulgariacategoryId;
  label: string;
  example: string;
  hint: string;
}[] = [
  { id: "standard",   label: "Standard",         example: "A 1234 BC",   hint: "Region code · 4 digits · 2 letters" },
  { id: "motorcycle", label: "Motorcycle",        example: "PB 1234 BC",  hint: "Region code · 4 digits · 2 letters (moto format)" },
  { id: "military",   label: "Military",          example: "BA 509 096",  hint: "Always starts with BA, then up to 7 digits (grouped in threes) — flag instead of the EU stars" },
  { id: "vanity",     label: "Vanity",            example: "CB TOPEX",    hint: "Region code · custom letters (only A B E K M H O P C T Y X exist on Bulgarian plates)" },
  { id: "temporary",  label: "Temporary",         example: "201 M 091 19", hint: "3 digits · letter · 3 digits, red end block with the year" },
  { id: "diplomatic", label: "Diplomatic",        example: "C 1103 16", hint: "Red plate, white lettering — region code, 4 digits, year" },
  { id: "foreign",    label: "Foreign citizens",  example: "XH 2064 25", hint: "Blue plate, white lettering — XH, 4 digits, expiry year under the dash" },
];

export const BG_FORMAT_LABELS: Record<string, string> = {
  "single-euroband":   "Single-line with euroband",
  "two-line-euroband": "Two-line with euroband",
  "two-line":          "Two-line",
  "two-line-flag":     "Two-line with flag",
  "single-flag":       "Single-line with flag",
  "single":            "Single-line",
};

export const BULGARIA_FORMATS_FOR: Record<BulgariacategoryId, string[]> = {
  standard:   ["single-euroband", "two-line-euroband", "single-flag", "two-line-flag"],
  motorcycle: ["two-line-euroband", "two-line-flag"],
  military:   ["single-flag", "two-line-flag"],
  vanity:     ["single-euroband", "two-line-euroband", "single-flag", "two-line-flag"],
  temporary:  ["single"],
  diplomatic: ["single"],
  foreign:    ["single"],
};

/** Auto-detect category from typed plate text (best-effort). */
export function detectBulgariaCategory(raw: string): BulgariacategoryId | null {
  const t = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if (!t) return null;
  if (/^BA /.test(t)) return "military";
  if (/^XH /.test(t)) return "foreign";
  if (/^\d/.test(t)) return "temporary";
  // If it looks like region + 4 digits + 2 letters
  if (/^[A-Z]{1,2} \d{4} [A-Z]{2}$/.test(t)) return "standard";
  return null;
}

/**
 * Plate patterns per category: "X" = any letter, "#" = any digit, anything else is fixed
 * and filled in for the user. A one-letter and a two-letter region (C / CA, B / BH …) are two variants.
 */
export const BULGARIA_PATTERNS: Partial<Record<BulgariacategoryId, string[]>> = {
  standard: ["X #### XX", "XX #### XX"],
  motorcycle: ["X #### XX", "XX #### X"],
  temporary: ["### X ### ##"],
  diplomatic: ["X #### ##", "XX #### ##"],
  foreign: ["XH #### ##", "XX #### ##"],
};

/**
 * Stored Bulgarian plate types are "<category>__<format>" (e.g. "military__single-flag").
 * Older spots store only the format ("single-euroband").
 */
export function parseBulgariaPlateType(t?: string | null): { category: BulgariacategoryId | null; format: string } {
  const raw = t ?? "";
  const i = raw.indexOf("__");
  if (i > 0) {
    const cat = BULGARIA_CATEGORIES.find((c) => c.id === raw.slice(0, i));
    if (cat) return { category: cat.id, format: raw.slice(i + 2) };
  }
  return { category: null, format: raw };
}
