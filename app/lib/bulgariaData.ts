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
  { id: "military",   label: "Military",          example: "BA 1234567",  hint: "BA prefix · 7-digit serial" },
  { id: "vanity",     label: "Vanity",            example: "A BATMAN",    hint: "Region code · custom letters (no fixed length)" },
  { id: "temporary",  label: "Temporary",         example: "1234567 24",  hint: "7-digit serial · 2-digit year" },
  { id: "diplomatic", label: "Diplomatic",        example: "01 DM 42 01", hint: "Full diplomatic plate text" },
  { id: "foreign",    label: "Foreign Registered",example: "XH 1234 24", hint: "XH · 4 digits · 2-digit year" },
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
  standard:   ["single-euroband", "two-line-euroband"],
  motorcycle: ["two-line", "two-line-euroband"],
  military:   ["single-flag", "two-line-flag"],
  vanity:     ["single-euroband", "two-line-euroband"],
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
