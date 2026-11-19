/**
 * Orders the generations of a model for the pickers: newest first (oldest at the bottom), with a gap between the groups
 * ("8th gen", "7th gen facelift", "7th gen", …) like PlatesMania does.
 */

/** Start and end year of a name like "5th Gen Avant (4K5/C8) (2018-2023)" or "7th gen 5-door Hatch (5G), 2012–2017"; the end is Infinity while it is still built. */
function yearsOf(name: string): { start: number | null; end: number } {
  const all = [...name.matchAll(/(\d{4})\s*(?:[-–—]\s*(\d{4})?)?/g)].filter((m) => Number(m[1]) >= 1880 && Number(m[1]) <= 2100);
  const m = all[all.length - 1];
  if (!m) return { start: null, end: 0 };
  const hasDash = /[-–—]/.test(m[0]);
  return { start: Number(m[1]), end: m[2] ? Number(m[2]) : hasDash ? Infinity : Number(m[1]) };
}

/** "7th gen" → 7, "Mk 7" → 7, "Gen 3" → 3 (null when the name has no number). */
function ordinalOf(name: string): number | null {
  const m = name.match(/(\d+)\s*(?:st|nd|rd|th)\s*gen/i) ?? name.match(/\b(?:gen(?:eration)?|mk\.?|mark)\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}

function groupKey(name: string, start: number | null): string {
  const ord = ordinalOf(name);
  const facelift = /face\s?lift|\bfl\b|restyl|refresh|\bLCI\b/i.test(name) ? "fl" : "";
  if (ord !== null) return `${ord}${facelift}`;
  return `${start ?? name}${facelift}`;
}

export function orderGenerations<T extends { name: string }>(gens: T[]): (T & { gapBefore: boolean })[] {
  const rows = gens.map((g) => {
    const y = yearsOf(g.name);
    return { g, ...y, key: groupKey(g.name, y.start) };
  });
  rows.sort((a, b) => {
    const as = a.start ?? -1, bs = b.start ?? -1;
    if (as !== bs) return bs - as;                                  // newest start year first
    if (a.end !== b.end) return a.end === Infinity ? -1 : b.end === Infinity ? 1 : b.end - a.end;   // still-built ones first
    return a.g.name.localeCompare(b.g.name);
  });
  return rows.map((r, i) => ({ ...r.g, gapBefore: i > 0 && rows[i - 1].key !== r.key }));
}
