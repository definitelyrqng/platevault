export type CroatiacategoryId =
  | "regular"
  | "foreign"
  | "exceptional"
  | "motorcycle"
  | "vanity"
  | "dealer"
  | "oldtimer"
  | "military"
  | "export"
  | "police"
  | "diplomatic";

export const CROATIA_REGIONS: { code: string; city: string }[] = [
  { code: "BJ", city: "Bjelovar" },
  { code: "BM", city: "Beli Manastir" },
  { code: "ČK", city: "Čakovec" },
  { code: "DA", city: "Daruvar" },
  { code: "DE", city: "Delnice" },
  { code: "DJ", city: "Đakovo" },
  { code: "DU", city: "Dubrovnik" },
  { code: "GS", city: "Gospić" },
  { code: "IM", city: "Imotski" },
  { code: "KA", city: "Karlovac" },
  { code: "KC", city: "Koprivnica" },
  { code: "KR", city: "Krapina" },
  { code: "KT", city: "Kutina" },
  { code: "KŽ", city: "Križevci" },
  { code: "MA", city: "Makarska" },
  { code: "NA", city: "Našice" },
  { code: "NG", city: "Nova Gradiška" },
  { code: "OG", city: "Ogulin" },
  { code: "OS", city: "Osijek" },
  { code: "PS", city: "Podravska Slatina" },
  { code: "PU", city: "Pula" },
  { code: "PŽ", city: "Požega" },
  { code: "RI", city: "Rijeka" },
  { code: "SB", city: "Slavonski Brod" },
  { code: "SK", city: "Sisak" },
  { code: "SL", city: "Slatina" },
  { code: "ST", city: "Split" },
  { code: "ŠI", city: "Šibenik" },
  { code: "VK", city: "Vinkovci" },
  { code: "VT", city: "Virovitica" },
  { code: "VU", city: "Vukovar" },
  { code: "VŽ", city: "Varaždin" },
  { code: "ZD", city: "Zadar" },
  { code: "ZG", city: "Zagreb" },
  { code: "ŽU", city: "Županja" },
];

// All letters that appear in Croatian plate suffixes (A-Z + Croatian diacritics)
export const HR_LETTERS: string[] = [
  "A","B","C","Č","Ć","D","Đ","E","F","G","H","I","J","K","L",
  "M","N","O","P","R","S","Š","T","U","V","Z","Ž",
];

export const CROATIA_CATEGORIES: {
  id: CroatiacategoryId;
  label: string;
  example: string;
  hint: string;
  emoji: string;
}[] = [
  { id: "regular",     label: "Regular",           example: "ZG 1234 AB",  hint: "Standard passenger vehicle plate",                          emoji: "⬜" },
  { id: "foreign",     label: "Foreign Citizens",  example: "ZG 1234 AB",  hint: "Green text — foreign registered vehicles & enterprises",    emoji: "🟢" },
  { id: "exceptional", label: "Exceptional",       example: "ZG 1234 AB",  hint: "Red text — exceptional/special purpose vehicles",           emoji: "🔴" },
  { id: "motorcycle",  label: "Motorcycle",        example: "ZG 9619 GU",  hint: "White background, single-line, two-line or triple-row",     emoji: "🏍️" },
  { id: "vanity",      label: "Vanity",            example: "ZD EROSS-8", hint: "Custom text plate — region, then up to 7 characters",                    emoji: "✨" },
  { id: "dealer",      label: "Dealer",            example: "OS PP-144",   hint: "Region, then PP (always there) and the number",                       emoji: "⬜" },
  { id: "oldtimer",    label: "Oldtimer",          example: "ZG PV-144",   hint: "Region, then PV (always there) and the number",                     emoji: "🏛️" },
  { id: "military",    label: "Military",          example: "HV 236-MP",   hint: "Croatian Armed Forces — HV prefix, yellow plate, no euroband",           emoji: "🟡" },
  { id: "export",      label: "Export",            example: "RH 806-BF",   hint: "Export plates — RH prefix, green plate with yellow text, no euroband",   emoji: "🟩" },
  { id: "diplomatic",  label: "Diplomatic",        example: "029-A-033",   hint: "Light blue plate, gold lettering, no euroband",                emoji: "🔷" },
  { id: "police",      label: "Police",            example: "140 312",     hint: "Police vehicle plates — two 3-digit groups, blue lettering, no euroband",                emoji: "🔵" },
];

export const CROATIA_FORMATS_FOR: Record<CroatiacategoryId, string[]> = {
  regular:     ["single-line-euroband","single-line","two-line-euroband","two-line"],
  foreign:     ["single-line-euroband","single-line","two-line-euroband","two-line"],
  exceptional: ["single-line-euroband","single-line","two-line-euroband","two-line"],
  motorcycle:  ["triple-row-euroband","triple-row","two-line-euroband","two-line"],
  vanity:      ["single-line-euroband","single-line"],
  dealer:      ["single-line-euroband","single-line"],
  oldtimer:    ["single-line-euroband","single-line"],
  military:    ["single-line"],
  export:      ["single-line"],
  police:      ["single-line"],
  diplomatic:  ["single-line"],
};

export const HR_FORMAT_LABELS: Record<string, string> = {
  "single-line-euroband":  "Single line · with euroband",
  "single-line":           "Single line · no euroband",
  "two-line-euroband":     "Two line · with euroband",
  "two-line":              "Two line · no euroband",
  "triple-row-euroband":   "Triple row · with euroband",
  "triple-row":            "Triple row · no euroband",
};

/**
 * Stored Croatian plate types are "<category>__<format>" (e.g. "foreign__single-line").
 * Older spots store only the format ("single-line-euroband").
 */
export function parseCroatiaPlateType(t?: string | null): { category: CroatiacategoryId | null; format: string } {
  const raw = t ?? "";
  const i = raw.indexOf("__");
  if (i > 0) {
    const cat = CROATIA_CATEGORIES.find((c) => c.id === raw.slice(0, i));
    if (cat) return { category: cat.id, format: raw.slice(i + 2) };
  }
  return { category: null, format: raw };
}

/** Croatian plates are typed freely (region letters incl. Č Ć Đ Š Ž, digits, dash, letters); no fixed pattern. */
export const CROATIA_PATTERNS: Partial<Record<CroatiacategoryId, string[]>> = {
  police: ["### ###"],
  diplomatic: ["###-X-###"],
  military: ["HV ###-XX"],
  export: ["RH ###-XX"],
  dealer: ["XX PP-####"],      // PP is always there; 1–4 digits
  oldtimer: ["XX PV-####"],    // PV is always there; 1–4 digits
};

/** Diplomatic plates: the leading 3-digit code is the country or organisation (029-A-033 → Slovakia). */
const DIPLOMATIC_RAW = "010 Holy See;011 Germany;012 Austria;013 Italy;014 Hungary;015 Sweden;016 Slovenia;017 Poland;018 France;019 Sudan;020 United Kingdom;021 Switzerland;022 China;023 Norway;024 United States;025 Bulgaria;026 Iran;027 Russia;028 Czech Republic;029 Slovakia;030 Bosnia and Herzegovina;031 Turkey;032 Romania;033 UNICEF;034 WHO;035 WFP;036 UNHCR;039 Spain;040 Malta;041 Belgium;042 Denmark;043 Canada;047 Albania;048 Netherlands;049 Serbia;050 North Macedonia;051 Malaysia;052 Pakistan;053 Greece;054 Ukraine;055 Chile;056 IMF (International Monetary Fund);057 India;058 UNDP (United Nations Development Programme);059 European Union;060 EBRD;061 ICRC;062 IOM;063 OSCE;064 South Korea;065 UN-NGLS;066 Finland;067 Egypt;068 UNESCO;069 World Bank;070 Japan;071 Israel;072 Guinea-Bissau;073 Portugal;074 Australia;077 RACVIAC (Centre for Security Cooperation);078 Libya;079 Denmark;081 International Sava River Basin Commission;082 Brazil;083 United Nations;084 Montenegro;085 Algeria;086 Kazakhstan;087 Kosovo;088 Azerbaijan;089 Indonesia;090 Morocco;091 Qatar;092 Lithuania;093 European Commission;094 Ireland;095 Iraq";
export const CROATIA_DIPLOMATIC_CODES: Record<string, string> = Object.fromEntries(
  DIPLOMATIC_RAW.split(";").map((e) => [e.slice(0, 3), e.slice(4)]),
);
export function croatiaDiplomaticOwner(text: string): string | null {
  const code = text.trim().slice(0, 3);
  return /^d{3}$/.test(code) ? (CROATIA_DIPLOMATIC_CODES[code] ?? null) : null;
}
