// Bosnia & Herzegovina plate data

export type BosniacategoryId = "regular" | "taxi" | "provisional" | "year-1998";

export const BOSNIA_CATEGORIES: {
  id: BosniacategoryId;
  label: string;
  example: string;
  hint: string;
}[] = [
  { id: "regular",     label: "Regular plates",    example: "A12-E-345", hint: "Letter + 2 digits – canton letter – 3 digits" },
  { id: "taxi",        label: "Taxi",              example: "TA-123456", hint: "Starts with TA-" },
  { id: "provisional", label: "Provisional",       example: "TT-123456", hint: "Starts with TT- or MT-" },
  { id: "year-1998",   label: "1998 year system",  example: "123-A-456", hint: "3 digits – letter – 3 digits (pre-reform)" },
];

// Per-category layout formats
export const BOSNIA_FORMATS_FOR: Record<BosniacategoryId, string[]> = {
  regular:     ["single-euroband", "two-line-euroband"],
  taxi:        ["single-euroband", "two-line-euroband"],
  provisional: ["single-euroband", "two-line-euroband"],
  "year-1998": ["single-no-euroband", "two-line-no-euroband"],
};

export const BA_FORMAT_LABELS: Record<string, string> = {
  "single-euroband":       "Single-line with euroband",
  "two-line-euroband":     "Two-line with euroband",
  "single-no-euroband":    "Single-line without euroband",
  "two-line-no-euroband":  "Two-line without euroband",
};

/** Auto-detect category from typed plate text. */
export function detectBosniaCategory(raw: string): BosniacategoryId | null {
  const t = raw.trim().toUpperCase();
  if (!t) return null;
  if (/^TA-?/.test(t)) return "taxi";
  if (/^(TT|MT)-?/.test(t)) return "provisional";
  if (/^\d/.test(t)) return "year-1998";
  if (/^[A-Z]\d/.test(t)) return "regular";
  return null;
}
