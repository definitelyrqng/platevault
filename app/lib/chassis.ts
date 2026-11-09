/**
 * Chassis / platform codes live inside generation names, e.g.
 *   "2nd Gen (4K8/C8) (2018-2023)"  →  label "2nd Gen", codes 4K8 + C8, years 2018–2023
 *
 * A code page ("all C8s") is brand-scoped: /catalog/<brand>/chassis/<code>.
 * Facelift variants count as their base platform: C7.5 → C7, G01 LCI → G01,
 * B299 Phase 2 → B299.
 */

export type GenCode = { raw: string; code: string };
export type ParsedGeneration = { label: string; years: string | null; codes: GenCode[] };

const YEARS = /^\s*\d{4}\s*[-–]\s*(\d{4})?\s*$/;

export function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** "C7.5" → "C7", "G01 LCI" → "G01", "B299 Phase 2" → "B299". */
export function normaliseCode(raw: string) {
  return raw.trim().replace(/\s+(LCI|Facelift|Phase\s*\d+)$/i, "").replace(/\.\d+$/, "").trim();
}

export const codeSlug = toSlug;

export function parseGeneration(name: string): ParsedGeneration {
  const groups = [...name.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  let years: string | null = null;
  let codeGroup: string | null = null;
  for (const g of groups) {
    if (YEARS.test(g)) years = g.trim();
    else if (codeGroup === null) codeGroup = g;
  }
  const label = name.replace(/\s*\([^)]*\)/g, "").trim();

  let raws = codeGroup ? codeGroup.split("/").map((s) => s.trim()).filter(Boolean) : [];
  if (!raws.length) {
    // "X243 Facelift (2023-2025)": the code is the first word
    const m = label.match(/^([A-Z]{1,3}\d{2,4}[A-Z]?)\b/);
    if (m) raws = [m[1]];
  }

  const seen = new Set<string>();
  const codes: GenCode[] = [];
  for (const raw of raws) {
    const code = normaliseCode(raw);
    const key = code.toLowerCase();
    if (!code || seen.has(key)) continue;
    seen.add(key);
    codes.push({ raw, code });
  }
  return { label, years, codes };
}

/** "2018-2023" → "2018–2023", "2023-" → "2023–present". */
export function formatYears(years: string) {
  const m = years.match(/^\s*(\d{4})\s*[-–]\s*(\d{4})?\s*$/);
  if (!m) return years;
  return m[2] ? `${m[1]}–${m[2]}` : `${m[1]}–present`;
}

/** Overall span of several generation names, e.g. "2011–present". */
export function yearSpan(names: string[]) {
  let start = Infinity;
  let end = -Infinity;
  let open = false;
  for (const n of names) {
    const y = parseGeneration(n).years?.match(/^\s*(\d{4})\s*[-–]\s*(\d{4})?\s*$/);
    if (!y) continue;
    start = Math.min(start, Number(y[1]));
    if (y[2]) end = Math.max(end, Number(y[2])); else open = true;
  }
  if (!Number.isFinite(start)) return null;
  return open ? `${start}–present` : end > start ? `${start}–${end}` : `${start}`;
}

/** Unique base codes of a list of generation names, in order of appearance. */
export function codesOf(names: string[]) {
  const seen = new Map<string, string>();
  for (const n of names) for (const c of parseGeneration(n).codes) if (!seen.has(codeSlug(c.code))) seen.set(codeSlug(c.code), c.code);
  return [...seen.values()];
}

export function hasCode(generation: string | null | undefined, slug: string) {
  if (!generation) return false;
  return parseGeneration(generation).codes.some((c) => codeSlug(c.code) === slug);
}

/**
 * The platform a generation link filters by: the last code in its brackets
 * ("4K8/C8" → C8, "4F5/C6" → C6). Null when the name has no code.
 */
export function platformOf(name: string): string | null {
  const codes = parseGeneration(name).codes;
  return codes.length ? codes[codes.length - 1].code : null;
}
