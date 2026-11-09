/**
 * Short, human-friendly plate type names for badges, filter chips and links.
 *
 * Stored plateType IDs differ per country ("car-2011-standard",
 * "at-regular-single-euroband", "cz-car2001-single-euro", "de-red-06" …).
 * plateTypeLabel() turns any of them into something normal like
 * "2011 Series", "Electric", "Red 06 · Trade" or "Standard · Two-line".
 * The everyday plate of a country is simply "Standard".
 */

/** Countries whose IDs need hand-written names. */
const EXACT: Record<string, Record<string, string>> = {
  albania: {
    "car-2011-standard":   "2011 Series",
    "car-2011-double":     "2011 Series · Two-line",
    "car-2011-us":         "2011 Series · US-size",
    "moto-2011":           "2011 Motorcycle",
    "trailer-2011-single": "2011 Trailer",
    "trailer-2011-double": "2011 Trailer · Two-line",
    "car-1993-single":     "1993 Series",
  },
};

/** Category part of the ID → name. Longest keys are matched first. */
const CATEGORIES: Record<string, string> = {
  "seasonal-h":    "Seasonal Oldtimer",
  "transit-5day":  "Short-term",
  "electric-vanity": "Electric Personalised",
  "federal-bd":    "Federal Agency",
  "federal-bp":    "Federal Police",
  "federal-bw":    "Federal Waterways",
  "federal-thw":   "Federal Relief (THW)",
  "red-04":        "Red 04 · Dealer",
  "red-05":        "Red 05 · Inspection",
  "red-06":        "Red 06 · Trade",
  "red-07":        "Red 07 · Classic",
  "dealer-1947":   "Dealer (1947)",
  "car2001":       "2001 Series",
  "1947":          "1947 Series",
  regular:         "Standard",
  electric:        "Electric",
  export:          "Export",
  oldtimer:        "Oldtimer",
  seasonal:        "Seasonal",
  transferable:    "Transferable",
  military:        "Military",
  official:        "Official",
  diplomatic:      "Diplomatic",
  provisional:     "Provisional",
  dealer:          "Dealer",
  vanity:          "Personalised",
  din:             "DIN (pre-2000)",
  car:             "Standard",
};

/** Format part of the ID → suffix. Single-line with Euroband is the default and adds nothing. */
const FORMATS: Array<[RegExp, string]> = [
  [/(^|-)(two-line|double)(-|$)/, "Two-line"],
  [/(^|-)us(-|$)/, "US-size"],
  [/(^|-)moto(-|$)/, "Motorcycle"],
  [/(^|-)repeater(-|$)/, "Repeater"],
  [/(^|-)no-euroband(-|$)/, "No Euroband"],
];

const COUNTRY_PREFIX = /^(de|at|al|be|ba|bg|hr|cz)-/i;

export function plateTypeLabel(country: string, type: string | null | undefined): string | null {
  if (!type) return null;
  const exact = EXACT[country.toLowerCase()]?.[type];
  if (exact) return exact;

  let rest = type.toLowerCase().replace(COUNTRY_PREFIX, "");

  // Category: first matching key at the start of the remaining ID
  let category = "";
  for (const key of Object.keys(CATEGORIES).sort((a, b) => b.length - a.length)) {
    if (rest === key || rest.startsWith(key + "-")) {
      category = CATEGORIES[key];
      rest = rest.slice(key.length).replace(/^-/, "");
      break;
    }
  }

  const suffixes = FORMATS.filter(([re]) => re.test(rest)).map(([, label]) => label);

  // Unknown leftover words (not just format words) — show them title-cased so nothing is lost
  const formatWords = /^(single|single-line|line|euroband|no-euroband|euro|dash|two-line|double|us|moto|repeater|din)$/;
  const leftover = rest.split("-").filter((w) => w && !formatWords.test(w) && w !== "no" && w !== "line" && w !== "two");
  if (!category && leftover.length) {
    category = leftover.join(" ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return [category || "Standard", ...suffixes].join(" · ");
}
