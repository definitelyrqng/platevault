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
  | "police";

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
  { id: "motorcycle",  label: "Motorcycle",        example: "ZG 1234 AB",  hint: "White background, single-line, two-line or triple-row",     emoji: "🏍️" },
  { id: "vanity",      label: "Vanity",            example: "ZG BIRTHDAY", hint: "Custom text plate — up to 7 characters",                    emoji: "✨" },
  { id: "dealer",      label: "Dealer",            example: "ZG PP 1234",  hint: "Dealer transit plates — PP is fixed",                       emoji: "⬜" },
  { id: "oldtimer",    label: "Oldtimer",          example: "ZG PV 1234",  hint: "Historic vehicle plates — PV is fixed",                     emoji: "🏛️" },
  { id: "military",    label: "Military",          example: "HV 1234 AB",  hint: "Croatian Armed Forces — HV prefix, yellow plate",           emoji: "🟡" },
  { id: "export",      label: "Export",            example: "RH 1234 AB",  hint: "Export plates — RH prefix, green plate with yellow text",   emoji: "🟩" },
  { id: "police",      label: "Police",            example: "123 456",     hint: "Police vehicle plates — two 3-digit groups",                emoji: "🔵" },
];

export const CROATIA_FORMATS_FOR: Record<CroatiacategoryId, string[]> = {
  regular:     ["single-line-euroband","single-line","two-line-euroband","two-line"],
  foreign:     ["single-line-euroband","single-line","two-line-euroband","two-line"],
  exceptional: ["single-line-euroband","single-line","two-line-euroband","two-line"],
  motorcycle:  ["single-line-euroband","single-line","two-line-euroband","two-line","triple-row-euroband","triple-row"],
  vanity:      ["single-line-euroband","single-line"],
  dealer:      ["single-line-euroband","single-line"],
  oldtimer:    ["single-line-euroband","single-line"],
  military:    ["single-line"],
  export:      ["single-line"],
  police:      ["single-line"],
};

export const HR_FORMAT_LABELS: Record<string, string> = {
  "single-line-euroband":  "Single line · with euroband",
  "single-line":           "Single line · no euroband",
  "two-line-euroband":     "Two line · with euroband",
  "two-line":              "Two line · no euroband",
  "triple-row-euroband":   "Triple row · with euroband",
  "triple-row":            "Triple row · no euroband",
};
