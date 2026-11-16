/**
 * Plate texts that count as the same plate. Czech plates never use the letter O — it is drawn as a zero —
 * so "9PO 9527" and "9P0 9527" are one plate. Returns every spelling to look for (this one included).
 */
export function plateTextVariants(country: string, text: string): string[] {
  const t = text.trim().toUpperCase();
  if (country.toLowerCase() !== "czech") return [t];
  const slots = [...t].flatMap((c, i) => (c === "0" || c === "O" ? [i] : [])).slice(0, 8);
  const out: string[] = [];
  for (let m = 0; m < 1 << slots.length; m++) {
    const chars = [...t];
    slots.forEach((i, k) => { chars[i] = m & (1 << k) ? "O" : "0"; });
    out.push(chars.join(""));
  }
  return [...new Set(out)];
}

/** The spelling that is stored for a new spot. */
export function normalisePlateText(country: string, text: string): string {
  const t = text.trim().toUpperCase();
  return country.toLowerCase() === "czech" ? t.replace(/O/g, "0") : t;
}
