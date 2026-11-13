// Bosnia & Herzegovina plate data

export type BosniacategoryId = "regular" | "taxi" | "provisional" | "agricultural" | "diplomatic" | "year-1998";

export const BOSNIA_CATEGORIES: {
  id: BosniacategoryId;
  label: string;
  example: string;
  hint: string;
}[] = [
  { id: "regular",     label: "Regular plates",    example: "A12-E-345", hint: "Letter + 2 digits – canton letter – 3 digits" },
  { id: "taxi",        label: "Taxi",              example: "TA-123456", hint: "Starts with TA-" },
  { id: "provisional", label: "Testing & portable", example: "TT-123456", hint: "TT = testing plates (Testne tablice), MT = portable plates (Prenosne tablice) — red" },
  { id: "agricultural", label: "Agricultural vehicles", example: "M80-T-096", hint: "Same format as regular plates, green frame and lettering" },
  { id: "diplomatic",   label: "Diplomatic",         example: "14-A-094",  hint: "Country / organisation code – letter – 3 digits. Blue plate, gold lettering, no euroband" },
  { id: "year-1998",   label: "1998 year system",  example: "123-A-456", hint: "3 digits – letter – 3 digits (pre-reform)" },
];

// Per-category layout formats
export const BOSNIA_FORMATS_FOR: Record<BosniacategoryId, string[]> = {
  regular:     ["single-euroband", "two-line-euroband"],
  taxi:        ["single-euroband", "two-line-euroband"],
  provisional: ["single-euroband", "two-line-euroband"],
  agricultural: ["single-euroband", "two-line-euroband"],
  diplomatic:  ["single-no-euroband", "two-line-no-euroband"],
  "year-1998": ["single-no-euroband", "two-line-no-euroband"],
};

/**
 * Plate patterns per category: "X" = any letter, "#" = any digit, anything else is fixed
 * and filled in for the user. Categories with two entries have two real formats.
 */
export const BOSNIA_PATTERNS: Record<BosniacategoryId, string[]> = {
  regular: ["X##-X-###"],
  taxi: ["TA-######"],
  provisional: ["TT-######", "MT-######"],
  agricultural: ["X##-X-###"],
  diplomatic: ["##-X-###", "####-X-###"],
  "year-1998": ["###-X-###"],
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

/**
 * Stored Bosnian plate types are "<category>__<format>" (e.g. "provisional__single-euroband").
 * Older spots store only the format ("single-euroband").
 */
export function parseBosniaPlateType(t?: string | null): { category: BosniacategoryId | null; format: string } {
  const raw = t ?? "";
  const i = raw.indexOf("__");
  if (i > 0) {
    const cat = BOSNIA_CATEGORIES.find((c) => c.id === raw.slice(0, i));
    if (cat) return { category: cat.id, format: raw.slice(i + 2) };
  }
  return { category: null, format: raw };
}

/** Diplomatic plates: the leading code is the country or organisation (e.g. 14-A-094 → Turkey). */
const DIPLOMATIC_RAW = "10 France;11 United States;12 Iran;13 Croatia;14 Turkey;15 Germany;16 Austria;17 Saudi Arabia;18 Italy;19 Kuwait;20 United Kingdom;21 Sudan;22 Qatar;23 Netherlands;24 Libya;25 Switzerland;26 Egypt;27 Ireland;28 Slovenia;29 OSCE (Organization for Security and Cooperation in Europe);30 Canada;32 Sweden;33 Russia;34 Czech Republic;35 United Nations;36 Pakistan;37 Office of the High Representative;38 Commission on Human Rights;39 Norway;40 Bulgaria;41 International Bank for Reconstruction and Development;42 Portugal;43 Malaysia;44 UNHCR (UN High Commissioner for Refugees);45 UAE;46 International Monetary Fund;47 Customs and Fiscal Assistance Office;48 Denmark;49 European Central Bank;50 European Commission in Bosnia and Herzegovina;51 UN Development Programme;52 International Organization for Migration;53 Belgium;54 Central Bank;55 Commission for Property of Displaced Persons and Refugees;56 Japan;57 UNESCO;58 North Macedonia;59 Hungary;60 UNICEF;61 Spain;62 Palestine;63 Greece;64 EU Monitoring Mission in the former Yugoslavia;65 International Monetary Group;66 China;68 World Health Organization;69 Romania;70 International Centre for Migration Policy Development;71 International Commission on Missing Persons;72 Sovereign Military Order of Malta;73 International Committee of the Red Cross;74 Poland;75 Council of Europe;76 International Trust Fund;77 International Federation of Red Cross and Red Crescent Societies;78 International Finance Corporation;79 Vatican City;80 Serbia;81 Office of the High Commissioner for Human Rights;82 Guinea-Bissau;83 Refugees Return Foundation;84 EU Police Mission (A prefix) / EU Monitoring Mission (M prefix);85 Regional Environmental Centre;86 Stability Pact Anti-corruption Initiative;87 Slovakia;88 The Registry;89 High Judicial and Prosecutorial Council;90 Office of the EU Special Representative;91 Japan International Cooperation Agency;92 Montenegro;93 Australia;94 Qatar;95 Ukraine;96 Regional Cooperation Council;97 Peace Support Operation Training Centre;0100 Malaysia;0102 Azerbaijan;0103 Brazil;0119 Algeria";
export const BOSNIA_DIPLOMATIC_CODES: Record<string, string> = Object.fromEntries(
  DIPLOMATIC_RAW.split(";").map((e) => { const i = e.indexOf(" "); return [e.slice(0, i), e.slice(i + 1)]; }),
);

/** Country or organisation of a diplomatic plate text such as "14-A-094" (or while typing "14-"). */
export function bosniaDiplomaticOwner(text: string): string | null {
  const code = text.trim().split("-")[0];
  return /^[0-9]{2,4}$/.test(code) ? (BOSNIA_DIPLOMATIC_CODES[code] ?? null) : null;
}
