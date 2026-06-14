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
  | "diplomatic";

export type BelgiumPlateColor = "red" | "green";

export const BELGIUM_CATEGORIES: {
  id: BelgiumCategoryId;
  label: string;
  color: BelgiumPlateColor;
  example: string;
  hint: string;
}[] = [
  { id: "regular",       label: "Regular car plates",          color: "red",   example: "1-ABC-123",  hint: "Standard format since 2010" },
  { id: "oldtimer",      label: "Oldtimers",                   color: "red",   example: "O-ABC-123",  hint: "Starts with O or 1 (pre-2010 vehicles)" },
  { id: "motorcycle",    label: "Motorcycles",                 color: "red",   example: "M-ABC-123",  hint: "Starts with M-X or 1-M" },
  { id: "taxi",          label: "Taxi",                        color: "red",   example: "T-AAA",      hint: "Starts with T-XA" },
  { id: "trailer",       label: "Trailers",                    color: "red",   example: "Q-ABC-123",  hint: "Starts with Q-X" },
  { id: "dealer",        label: "Dealer",                      color: "green", example: "Z-AAA",      hint: "Starts with 1-Z or Z-X" },
  { id: "international", label: "International organizations", color: "red",   example: "8-AA-123",   hint: "Starts with 8-AA (since 2010)" },
  { id: "agricultural",  label: "Agricultural vehicles",       color: "red",   example: "G-LAA",      hint: "Starts with G-L (since 2013)" },
  { id: "moped",         label: "Mopeds",                      color: "red",   example: "S-AAA",      hint: "Starts with S-X" },
  { id: "rental",        label: "Rental cars",                 color: "red",   example: "T-LAA",      hint: "Starts with 1-TL or T-L" },
  { id: "testing",       label: "Testing",                     color: "green", example: "Y-AAA",      hint: "Starts with Y-AAA or Y-QAA" },
  { id: "professional",  label: "Professional plates",         color: "green", example: "V-AA-123",   hint: "Starts with V-AA" },
  { id: "vanity",        label: "Vanity",                      color: "red",   example: "HELLO",      hint: "Custom text (since 2014)" },
  { id: "year-1951",     label: "1951 Year system",            color: "red",   example: "AAA-111",    hint: "Select era pattern below" },
  { id: "diplomatic",    label: "Diplomatic",                  color: "red",   example: "01 CD 123",  hint: "Freetype diplomatic format" },
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
  if (/^M-/i.test(t) || /^\d-M/i.test(t)) return "motorcycle";
  // Taxi: T-XA (second segment ends with A — wait for at least T-X)
  if (/^T-/i.test(t)) return "taxi";
  // Trailer
  if (/^Q-/i.test(t)) return "trailer";
  // Dealer: Z-X or 1-Z
  if (/^Z-/i.test(t) || /^\d-Z/i.test(t)) return "dealer";
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
  regular: STANDARD_FORMATS, oldtimer: STANDARD_FORMATS, motorcycle: STANDARD_FORMATS,
  taxi: STANDARD_FORMATS, trailer: STANDARD_FORMATS, dealer: STANDARD_FORMATS,
  international: STANDARD_FORMATS, agricultural: STANDARD_FORMATS, moped: STANDARD_FORMATS,
  rental: STANDARD_FORMATS, testing: STANDARD_FORMATS, professional: STANDARD_FORMATS,
  vanity: STANDARD_FORMATS, "year-1951": FORMATS_1951, diplomatic: STANDARD_FORMATS,
};

export const BE_FORMAT_LABELS: Record<string, string> = {
  "single-dash":          "Single-line (with dash)",
  "single-no-dash":       "Single-line (without dash)",
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
