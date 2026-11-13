// Belgium plate data

export type BelgiumCategoryId =
  | "regular"
  | "oldtimer"
  | "motorcycle"
  | "taxi"
  | "trailer"
  | "dealer"
  | "international"
  | "agricultural"
  | "moped"
  | "rental"
  | "testing"
  | "professional"
  | "vanity"
  | "year-1951"
  | "diplomatic"
  | "military";

export type BelgiumPlateColor = "red" | "green";

export const BELGIUM_CATEGORIES: {
  id: BelgiumCategoryId;
  label: string;
  color: BelgiumPlateColor;
  example: string;
  hint: string;
}[] = [
  { id: "regular",       label: "Regular car plates",          color: "red",   example: "1-XXX-123",  hint: "Standard format since 2010" },
  { id: "oldtimer",      label: "Oldtimers",                   color: "red",   example: "O-XXX-123",  hint: "Oldtimers (25+ years), no emblem" },
  { id: "motorcycle",    label: "Motorcycles",                 color: "red",   example: "M-XXX-123",  hint: "Starts with M" },
  { id: "taxi",          label: "Taxi",                        color: "red",   example: "T-XAX-123",      hint: "T-XAX-123" },
  { id: "trailer",       label: "Trailers",                    color: "red",   example: "Q-AXX-123",  hint: "Q-AXX-123 or 1-QXX-123" },
  { id: "dealer",        label: "Dealer",                      color: "green", example: "Z-AAX-123",      hint: "Z-AAX-123, green" },
  { id: "international", label: "International organizations", color: "red",   example: "8-AAX-123",   hint: "8-AAX-123" },
  { id: "agricultural",  label: "Agricultural vehicles",       color: "red",   example: "G-LXX-123",      hint: "G-LXX-123" },
  { id: "moped",         label: "Mopeds",                      color: "red",   example: "S-XXX-123",      hint: "S-XXX-123" },
  { id: "rental",        label: "Rental cars",                 color: "red",   example: "T-LXX-123",      hint: "T-LXX-123 or 1-TLX-123" },
  { id: "testing",       label: "Testing",                     color: "green", example: "Y-AAA-123",      hint: "Y-AAA-123 or Y-QAA-123, green" },
  { id: "professional",  label: "Professional plates",         color: "green", example: "V-AAX-123",   hint: "V-AAX-123 or V-QAA-123, green" },
  { id: "vanity",        label: "Vanity",                      color: "red",   example: "HELLO",      hint: "Custom text (since 2014)" },
  // (1951 year system hidden for now — re-add its entry here to bring it back)
  { id: "diplomatic",    label: "Diplomatic",                  color: "red",   example: "01 CD 123",  hint: "Freetype diplomatic format" },
  { id: "military",      label: "Military",                    color: "red",   example: "26287",      hint: "Belgian Defence — digits only, flag strip" },
];

// 1951 era sub-formats
export const BELGIUM_1951_ERAS: { id: string; label: string; placeholder: string; regex: RegExp }[] = [
  { id: "1973-2008", label: "1973–2008 / AAA-111",  placeholder: "AAA-111",  regex: /^[A-Z]{3}[.\-]?\d{3}$/ },
  { id: "2008-2010", label: "2008–2010 / 111-111",  placeholder: "111-111",  regex: /^\d{3}[.\-]?\d{3}$/ },
  { id: "1971-1973", label: "1971–1973 / A.111.A",  placeholder: "A.111.A",  regex: /^[A-Z][.\-]\d{3}[.\-][A-Z]$/ },
  { id: "1962-111AA",label: "1962–1971 / 111.AA",   placeholder: "111.AA",   regex: /^\d{3}[.\-][A-Z]{2}$/ },
  { id: "1962-11AA1",label: "1962–1971 / 11.AA.1",  placeholder: "11.AA.1",  regex: /^\d{2}[.\-][A-Z]{2}[.\-]\d$/ },
  { id: "1962-1AA11",label: "1962–1971 / 1.AA.11",  placeholder: "1.AA.11",  regex: /^\d[.\-][A-Z]{2}[.\-]\d{2}$/ },
  { id: "1962-AA111",label: "1962–1971 / AA.111",   placeholder: "AA.111",   regex: /^[A-Z]{2}[.\-]\d{3}$/ },
  { id: "1951-1111A",label: "1951–1961 / 1111.A",   placeholder: "1111.A",   regex: /^\d{4}[.\-][A-Z]$/ },
  { id: "1951-111A1",label: "1951–1961 / 111.A.1",  placeholder: "111.A.1",  regex: /^\d{3}[.\-][A-Z][.\-]\d$/ },
  { id: "1951-11A11",label: "1951–1961 / 11.A.11",  placeholder: "11.A.11",  regex: /^\d{2}[.\-][A-Z][.\-]\d{2}$/ },
  { id: "1951-1A111",label: "1951–1961 / 1.A.111",  placeholder: "1.A.111",  regex: /^\d[.\-][A-Z][.\-]\d{3}$/ },
  { id: "1951-A1111",label: "1951–1961 / A.1111",   placeholder: "A.1111",   regex: /^[A-Z][.\-]\d{4}$/ },
];

// ── Auto-detection ──────────────────────────────────────────────────────────

/** Detect plate category from typed text. Returns null if not enough input yet. */
export function detectBelgiumCategory(raw: string): BelgiumCategoryId | null {
  const t = raw.trim().toUpperCase();
  if (t.length < 1) return null;

  // Rental must come before Taxi (1-TL / T-L)
  if (/^1-TL/i.test(t) || /^T-L/i.test(t)) return "rental";
  // Oldtimer
  if (/^O-/i.test(t)) return "oldtimer";
  // Motorcycle: M-X or 1-M
  if (/^[MW]-/i.test(t) || /^[0-9]-[MW]/i.test(t)) return "motorcycle";
  // Taxi: T-XA (second segment ends with A — wait for at least T-X)
  if (/^T-/i.test(t) || /^[0-9]-TX/i.test(t)) return "taxi";
  // Trailer
  if (/^[QU]-/i.test(t)) return "trailer";
  // Dealer: Z-X or 1-Z
  if (/^ZZ/i.test(t)) return "testing";
  if (/^Z-/i.test(t) || /^[0-9]-Z/i.test(t)) return "dealer";
  if (/^CD-/i.test(t)) return "diplomatic";
  // International: 8-AA
  if (/^8-/i.test(t)) return "international";
  // Agricultural: G-L
  if (/^G-L/i.test(t)) return "agricultural";
  // Moped: S-X
  if (/^S-/i.test(t)) return "moped";
  // Testing: Y-
  if (/^Y-/i.test(t)) return "testing";
  // Professional: V-AA
  if (/^V-/i.test(t)) return "professional";
  // Military: digits only (5–6)
  if (/^\d{5,6}$/.test(t)) return "military";
  // Regular: starts with digit
  if (/^\d/.test(t)) return "regular";

  return null;
}

/** Detect 1951 era from typed text. Returns matching era id or null. */
export function detect1951Era(raw: string): string | null {
  const t = raw.trim().toUpperCase();
  if (t.length < 3) return null;
  for (const era of BELGIUM_1951_ERAS) {
    if (era.regex.test(t)) return era.id;
  }
  // Partial matching — try prefix hints while typing
  if (/^[A-Z]{3}/.test(t) && !/^[A-Z]{4}/.test(t)) return "1973-2008";  // AAA...
  if (/^\d{3}[^A-Z]/.test(t)) return "2008-2010";                        // 111-...
  if (/^[A-Z][.\-]\d/.test(t)) return "1971-1973";                       // A.1...
  if (/^\d{4}/.test(t)) return "1951-1111A";                              // 1111...
  if (/^[A-Z]{2}[.\-]/.test(t)) return "1962-AA111";                     // AA....
  return null;
}

// Layout formats per category
const STANDARD_FORMATS = ["single-dash", "single-no-dash", "two-line", "two-line-us"];
const FORMATS_1951     = ["single-no-euroband", "two-line-no-euroband", "single-euroband", "two-line-euroband"];

export const BELGIUM_FORMATS_FOR: Record<BelgiumCategoryId, string[]> = {
  regular: STANDARD_FORMATS, oldtimer: STANDARD_FORMATS, motorcycle: ["two-line"],
  taxi: STANDARD_FORMATS, trailer: STANDARD_FORMATS, dealer: STANDARD_FORMATS,
  international: STANDARD_FORMATS, agricultural: ["single-dash"], moped: ["two-line"],
  rental: STANDARD_FORMATS, testing: STANDARD_FORMATS, professional: STANDARD_FORMATS,
  vanity: STANDARD_FORMATS, "year-1951": FORMATS_1951, diplomatic: STANDARD_FORMATS,
  military: ["military-single"],
};

export const BE_FORMAT_LABELS: Record<string, string> = {
  "single-dash":          "Single-line (with dash)",
  "single-no-dash":       "Single-line (without dash)",
  "military-single":      "Military, single-line",
  "two-line":             "Two-line",
  "two-line-us":          "Two-line (US vehicles & motorcycles)",
  "single-no-euroband":   "Single-line without euroband",
  "two-line-no-euroband": "Two-line without euroband",
  "single-euroband":      "Single-line with euroband",
  "two-line-euroband":    "Two-line with euroband",
};

export const BE_COLOR_CLASSES: Record<BelgiumPlateColor, string> = {
  red:   "border-red-700/60 text-red-300 bg-red-950/30",
  green: "border-green-700/60 text-green-300 bg-green-950/30",
};

/**
 * Stored Belgian plate types are "<category>__<format>" (e.g. "vanity__single-dash").
 * Older spots store only the format ("single-dash"), or "<format>__<era>" for 1951 plates.
 */
export function parseBelgiumPlateType(t?: string | null): { category: BelgiumCategoryId | null; format: string } {
  const raw = t ?? "";
  const i = raw.indexOf("__");
  if (i > 0) {
    const cat = BELGIUM_CATEGORIES.find((c) => c.id === raw.slice(0, i) && c.id !== "year-1951");
    if (cat) return { category: cat.id, format: raw.slice(i + 2) };
  }
  return { category: null, format: raw };
}

/**
 * Plate patterns per category: "X" = any letter, "#" = any digit, anything else is fixed
 * and filled in for the user. Categories with two entries have two real formats.
 */
export const BELGIUM_PATTERNS: Partial<Record<BelgiumCategoryId, string[]>> = {
  regular: ["#-XXX-###"],
  oldtimer: ["O-XXX-###"],
  motorcycle: ["M-XXX-###"],
  taxi: ["T-XAX-###"],
  trailer: ["Q-AXX-###", "1-QXX-###"],
  dealer: ["Z-AAX-###"],
  international: ["8-AAX-###"],
  agricultural: ["G-LXX-###"],
  moped: ["S-XXX-###"],
  rental: ["T-LXX-###", "1-TLX-###"],
  testing: ["Y-AAA-###", "Y-QAA-###"],
  professional: ["V-AAX-###", "V-QAA-###"],
};

/** "T-XAX-###" → "T-XAX-123" (what the preview shows before anything is typed). */
export const patternExample = (p: string) => p.replace(/#+/g, (m) => "1234567890".slice(0, m.length));

const isLetter = (c: string) => c >= "A" && c <= "Z";
const isDigit = (c: string) => c >= "0" && c <= "9";

/** Fit what the user typed to a pattern, filling in the fixed characters (dashes, fixed letters). */
export function maskBelgiumPlate(raw: string, pattern: string): string {
  const src = raw.toUpperCase();
  let pos = 0, out = "";
  for (const p of pattern) {
    if (p === "X" || p === "#") {
      const ok = p === "X" ? isLetter : isDigit;
      while (pos < src.length && !ok(src[pos])) pos++;
      if (pos >= src.length) break;
      out += src[pos++];
    } else {
      out += p;
      if (src[pos] === p) pos++;          // the user typed the fixed character themselves
    }
  }
  return out;
}

/** The typed text followed by the rest of the pattern as placeholders, for the live preview. */
export function padBelgiumPlate(text: string, pattern: string): string {
  let n = 0;
  const rest = [...pattern].slice(text.length).map((p) => (p === "X" ? "X" : p === "#" ? String((n++ % 3) + 1) : p)).join("");
  return text + rest;
}
