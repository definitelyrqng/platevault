// Czech Republic (Česká republika) plate data

// ── 2001-system: single-letter region codes ───────────────────────────────────
export interface CzechRegion2001 {
  code: string;   // single letter
  name: string;
}

export const CZECH_REGIONS_2001: CzechRegion2001[] = [
  { code: "A", name: "Capital City of Prague" },
  { code: "B", name: "South Moravian Region" },
  { code: "C", name: "South Bohemian Region" },
  { code: "E", name: "Pardubice Region" },
  { code: "H", name: "Hradec Králové Region" },
  { code: "J", name: "Vysočina Region" },
  { code: "K", name: "Karlovy Vary Region" },
  { code: "L", name: "Liberec Region" },
  { code: "M", name: "Olomouc Region" },
  { code: "P", name: "Plzeň Region" },
  { code: "S", name: "Central Bohemian Region" },
  { code: "T", name: "Moravian-Silesian Region" },
  { code: "U", name: "Ústí nad Labem Region" },
  { code: "X", name: "Capital City of Prague (alt.)" },
  { code: "Z", name: "Zlín Region" },
];

// ── Sport/Oldtimer region numbers 01–14 ──────────────────────────────────────
export interface CzechRegionNum {
  code: string;   // "01"–"14"
  name: string;
}
export const CZECH_REGION_NUMS: CzechRegionNum[] = [
  { code: "01", name: "Prague" },
  { code: "02", name: "Central Bohemian Region" },
  { code: "03", name: "South Bohemian Region" },
  { code: "04", name: "Plzeň Region" },
  { code: "05", name: "Karlovy Vary Region" },
  { code: "06", name: "Ústí nad Labem Region" },
  { code: "07", name: "Liberec Region" },
  { code: "08", name: "Hradec Králové Region" },
  { code: "09", name: "Pardubice Region" },
  { code: "10", name: "Vysočina Region" },
  { code: "11", name: "South Moravian Region" },
  { code: "12", name: "Olomouc Region" },
  { code: "13", name: "Zlín Region" },
  { code: "14", name: "Moravian-Silesian Region" },
];

// ── 1960-system: two-letter district codes (selec2) ─────────────────────────
export interface CzechRegion1960 {
  code: string;
  name: string;
}
export const CZECH_REGIONS_1960: CzechRegion1960[] = [
  { code: "AA", name: "High Authorities" },
  { code: "AB", name: "Capital City of Prague" },
  { code: "AC", name: "Capital City of Prague" },
  { code: "AD", name: "Capital City of Prague" },
  { code: "AE", name: "Capital City of Prague" },
  { code: "AH", name: "Capital City of Prague" },
  { code: "AJ", name: "Capital City of Prague" },
  { code: "AK", name: "Capital City of Prague" },
  { code: "AL", name: "Capital City of Prague" },
  { code: "AM", name: "Capital City of Prague" },
  { code: "AN", name: "Capital City of Prague" },
  { code: "AO", name: "Capital City of Prague" },
  { code: "AP", name: "Capital City of Prague" },
  { code: "AR", name: "Capital City of Prague" },
  { code: "AS", name: "Capital City of Prague" },
  { code: "AT", name: "Capital City of Prague" },
  { code: "AU", name: "Capital City of Prague" },
  { code: "AV", name: "Capital City of Prague" },
  { code: "AX", name: "Capital City of Prague" },
  { code: "AY", name: "Capital City of Prague" },
  { code: "AZ", name: "Capital City of Prague" },
  { code: "BE", name: "Beroun District" },
  { code: "BI", name: "Brno-Country District" },
  { code: "BK", name: "Blansko District" },
  { code: "BM", name: "Brno-City District" },
  { code: "BN", name: "Benešov District" },
  { code: "BO", name: "Brno-Country District" },
  { code: "BR", name: "Bruntál District" },
  { code: "BS", name: "Brno-City District" },
  { code: "BV", name: "Břeclav District" },
  { code: "BZ", name: "Brno-City District" },
  { code: "CB", name: "České Budějovice District" },
  { code: "CE", name: "České Budějovice District" },
  { code: "CH", name: "Cheb District" },
  { code: "CK", name: "Český Krumlov District" },
  { code: "CL", name: "Česká Lípa District" },
  { code: "CR", name: "Chrudim District" },
  { code: "CV", name: "Chomutov District" },
  { code: "DC", name: "Děčín District" },
  { code: "DO", name: "Domažlice District" },
  { code: "FM", name: "Frýdek-Místek District" },
  { code: "GT", name: "Gottwald (Zlín) District" },
  { code: "GV", name: "Gottwald (Zlín) District" },
  { code: "HB", name: "Havlíčkův Brod District" },
  { code: "HK", name: "Hradec Králové District" },
  { code: "HO", name: "Hodonín District" },
  { code: "HR", name: "Hradec Králové District" },
  { code: "JC", name: "Jičín District" },
  { code: "JE", name: "Jeseník District" },
  { code: "JH", name: "Jindřichův Hradec District" },
  { code: "JI", name: "Jihlava District" },
  { code: "JN", name: "Jablonec nad Nisou District" },
  { code: "KA", name: "Karviná District" },
  { code: "KD", name: "Kladno District" },
  { code: "KH", name: "Kutná Hora District" },
  { code: "KI", name: "Karviná District" },
  { code: "KL", name: "Kladno District" },
  { code: "KM", name: "Kroměříž District" },
  { code: "KO", name: "Kolín District" },
  { code: "KT", name: "Klatovy District" },
  { code: "KV", name: "Karlovy Vary District" },
  { code: "LB", name: "Liberec District" },
  { code: "LI", name: "Liberec District" },
  { code: "LN", name: "Louny District" },
  { code: "LT", name: "Litoměřice District" },
  { code: "MB", name: "Mladá Boleslav District" },
  { code: "ME", name: "Mělník District" },
  { code: "MO", name: "Most District" },
  { code: "NA", name: "Náchod District" },
  { code: "NB", name: "Nymburk District" },
  { code: "NJ", name: "Nový Jičín District" },
  { code: "NO", name: "Nový Jičín District" },
  { code: "OC", name: "Olomouc District" },
  { code: "OL", name: "Olomouc District" },
  { code: "OP", name: "Opava District" },
  { code: "OS", name: "Ostrava-City District" },
  { code: "OT", name: "Ostrava-City District" },
  { code: "OV", name: "Ostrava-City District" },
  { code: "PA", name: "Pardubice District" },
  { code: "PB", name: "Příbram District" },
  { code: "PC", name: "Prague-West District" },
  { code: "PE", name: "Pelhřimov District" },
  { code: "PH", name: "Prague-East District" },
  { code: "PI", name: "Písek District" },
  { code: "PJ", name: "Plzeň-South District" },
  { code: "PM", name: "Plzeň-City District" },
  { code: "PN", name: "Plzeň-City District" },
  { code: "PR", name: "Přerov District" },
  { code: "PS", name: "Plzeň-North District" },
  { code: "PT", name: "Prachatice District" },
  { code: "PU", name: "Pardubice District" },
  { code: "PV", name: "Prostějov District" },
  { code: "PY", name: "Prague-East District" },
  { code: "PZ", name: "Prague-West District" },
  { code: "RA", name: "Rakovník District" },
  { code: "RK", name: "Rychnov nad Kněžnou District" },
  { code: "RO", name: "Rokycany District" },
  { code: "SM", name: "Semily District" },
  { code: "SO", name: "Sokolov District" },
  { code: "ST", name: "Strakonice District" },
  { code: "SU", name: "Šumperk District" },
  { code: "SY", name: "Svitavy District" },
  { code: "TA", name: "Tábor District" },
  { code: "TC", name: "Tachov District" },
  { code: "TU", name: "Trutnov District" },
  { code: "UH", name: "Uherské Hradiště District" },
  { code: "UL", name: "Ústí nad Labem District" },
  { code: "UO", name: "Ústí nad Orlicí District" },
  { code: "US", name: "Ústí nad Labem District (alt.)" },
  { code: "VO", name: "Vsetín District" },
  { code: "VS", name: "Vsetín District" },
  { code: "VY", name: "Vyškov District" },
  { code: "ZL", name: "District of Zlín" },
  { code: "ZN", name: "Znojmo District" },
  { code: "ZR", name: "Žďár nad Sázavou District" },
];

// ── 1960 serial letters A–V ──────────────────────────────────────────────────
export const CZECH_SERIAL_LETTERS_1960 = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","R","S","T","U","V"
];

// ── Moto 1960 plate types ────────────────────────────────────────────────────
export const CZECH_MOTO1960_TYPES: { id: string; label: string; rental?: boolean }[] = [
  { id: "trap60",   label: "Two-row trapezoidal (1960)" },
  { id: "trap86",   label: "Two-row trapezoidal (1986)" },
  { id: "rect94",   label: "Two-row rectangular (1994)" },
  { id: "rect99",   label: "Two-row rectangular (1999)" },
  { id: "rent99",   label: "Two-row rectangular — Rental (1999)", rental: true },
];

// ── Categories ───────────────────────────────────────────────────────────────
export type CzechCategoryId =
  | "car2001"
  | "moto2001"
  | "dealer2001"
  | "sport2001"
  | "oldtimer2001"
  | "car1960"
  | "moto1960"
  | "commercial1960"
  | "agricultural1960"
  | "foreign"
  | "vanity"
  | "electric"
  | "diplomatic"
  | "export"
  | "trailer1977";

export interface CzechCategory {
  id: CzechCategoryId;
  label: string;
  emoji: string;
  example: string;
  hint: string;
  group: "current" | "historical" | "special";
}

export const CZECH_CATEGORIES: CzechCategory[] = [
  // Current (2001+)
  { id: "car2001",         label: "Regular Car",          emoji: "⬜", example: "1AY 3165",  hint: "Standard 2001-system white plate",                group: "current"   },
  { id: "moto2001",        label: "Motorcycle",           emoji: "🏍️", example: "3K 0128",   hint: "Two-line motorcycle plate (2001+)",               group: "current"   },
  { id: "dealer2001",      label: "Dealer",               emoji: "🟩", example: "H 5912",    hint: "Green-text dealer plate (2001+)",                  group: "current"   },
  { id: "sport2001",       label: "Sportscar",            emoji: "🏎️", example: "11R 0466",  hint: "Region number + R + digits",                      group: "current"   },
  { id: "oldtimer2001",    label: "Oldtimer",             emoji: "🏛️", example: "02V 1621",  hint: "Region number + V + digits",                      group: "current"   },
  { id: "electric",        label: "Electric",             emoji: "⚡", example: "EL0 1234",  hint: "EL prefix + digit + 4 digits",                    group: "current"   },
  { id: "vanity",          label: "Vanity",               emoji: "✨", example: "CZECHREP",  hint: "Custom text up to 9 characters",                  group: "current"   },
  { id: "diplomatic",      label: "Diplomatic",           emoji: "🟦", example: "1234 5678", hint: "Four digits, space, four digits",                  group: "current"   },
  { id: "export",          label: "Export",               emoji: "🟧", example: "EXPORT123", hint: "Custom export plate text",                        group: "current"   },
  // Historical (1960/1977)
  { id: "car1960",         label: "Car (1960)",           emoji: "🗂️", example: "NBI 47-69", hint: "Region + serial letter + number range",           group: "historical" },
  { id: "moto1960",        label: "Motorcycle (1960)",    emoji: "🏍️", example: "NBI 47-69", hint: "Two-row, trapezoidal or rectangular",             group: "historical" },
  { id: "commercial1960",  label: "Commercial (1960)",    emoji: "🟡", example: "NBI 47-69", hint: "Yellow commercial plate (1960 era)",              group: "historical" },
  { id: "agricultural1960",label: "Agricultural (1960)",  emoji: "🚜", example: "NBI 47-69", hint: "Yellow agricultural plate (1960 era)",            group: "historical" },
  { id: "trailer1977",     label: "Trailer (1977)",       emoji: "🚛", example: "NBI 47-69", hint: "Trailer plate, same format as 1960 car",          group: "historical" },
  // Special
  { id: "foreign",         label: "Foreign Citizen",      emoji: "🇪🇺", example: "1AY 3165", hint: "Yellow-on-blue plate for foreign residents",       group: "special"   },
];

// ── Plate format options ─────────────────────────────────────────────────────
export interface CzechPlateFormat {
  id: string;
  label: string;
}

export const CZECH_FORMATS: Record<CzechCategoryId, CzechPlateFormat[]> = {
  car2001: [
    { id: "single-euro",   label: "Single-line + euroband" },
    { id: "single",        label: "Single-line" },
    { id: "two-euro",      label: "Two-line + euroband" },
    { id: "two",           label: "Two-line" },
    { id: "us-euro",       label: "US-style + euroband" },
    { id: "us",            label: "US-style" },
  ],
  moto2001: [
    { id: "two-euro",      label: "Two-line + euroband" },
    { id: "two",           label: "Two-line" },
  ],
  dealer2001: [
    { id: "single-euro",   label: "Single-line + euroband" },
    { id: "single",        label: "Single-line" },
    { id: "two-euro",      label: "Two-line + euroband" },
    { id: "two",           label: "Two-line" },
  ],
  sport2001: [
    { id: "single-euro",   label: "Single-line + euroband" },
    { id: "single",        label: "Single-line" },
    { id: "two-euro",      label: "Two-line + euroband" },
    { id: "two",           label: "Two-line" },
    { id: "us-euro",       label: "US-style + euroband" },
    { id: "us",            label: "US-style" },
  ],
  oldtimer2001: [
    { id: "single-euro",   label: "Single-line + euroband" },
    { id: "single",        label: "Single-line" },
    { id: "two-euro",      label: "Two-line + euroband" },
    { id: "two",           label: "Two-line" },
    { id: "us-euro",       label: "US-style + euroband" },
    { id: "us",            label: "US-style" },
  ],
  electric: [
    { id: "single-euro",   label: "Single-line + euroband" },
    { id: "single",        label: "Single-line" },
    { id: "two-euro",      label: "Two-line + euroband" },
    { id: "two",           label: "Two-line" },
  ],
  vanity:      [{ id: "single", label: "Single-line" }],
  diplomatic:  [{ id: "single", label: "Single-line" }],
  export:      [{ id: "single", label: "Single-line" }],
  car1960: [
    { id: "trap60",        label: "Two-row trapezoidal (1960)" },
    { id: "trap86",        label: "Two-row trapezoidal (1986)" },
    { id: "rect94",        label: "Two-row rectangular (1994)" },
    { id: "rect99",        label: "Two-row rectangular (1999)" },
    { id: "rent99",        label: "Two-row rectangular — Rental (1999)" },
  ],
  moto1960: [
    { id: "trap60",        label: "Two-row trapezoidal (1960)" },
    { id: "trap86",        label: "Two-row trapezoidal (1986)" },
    { id: "rect94",        label: "Two-row rectangular (1994)" },
    { id: "rect99",        label: "Two-row rectangular (1999)" },
    { id: "rent99",        label: "Two-row rectangular — Rental (1999)" },
  ],
  commercial1960: [
    { id: "trap60",        label: "Two-row trapezoidal (1960)" },
    { id: "trap86",        label: "Two-row trapezoidal (1986)" },
    { id: "rect94",        label: "Two-row rectangular (1994)" },
    { id: "rect99",        label: "Two-row rectangular (1999)" },
  ],
  agricultural1960: [
    { id: "trap60",        label: "Two-row trapezoidal (1960)" },
    { id: "trap86",        label: "Two-row trapezoidal (1986)" },
    { id: "rect94",        label: "Two-row rectangular (1994)" },
    { id: "rect99",        label: "Two-row rectangular (1999)" },
  ],
  trailer1977: [
    { id: "trap60",        label: "Two-row trapezoidal" },
    { id: "rect94",        label: "Two-row rectangular (1994)" },
    { id: "rect99",        label: "Two-row rectangular (1999)" },
  ],
  foreign: [
    { id: "single-euro",   label: "Single-line + euroband" },
    { id: "single",        label: "Single-line" },
    { id: "two-euro",      label: "Two-line + euroband" },
    { id: "two",           label: "Two-line" },
    { id: "us-euro",       label: "US-style + euroband" },
    { id: "us",            label: "US-style" },
  ],
};

// ── Category groups ──────────────────────────────────────────────────────────
export const CZECH_CATEGORY_GROUPS: { id: string; label: string; ids: CzechCategoryId[] }[] = [
  { id: "current",    label: "Current (2001+)",   ids: ["car2001","moto2001","dealer2001","sport2001","oldtimer2001","electric","vanity","diplomatic","export","foreign"] },
  { id: "historical", label: "Historical",        ids: ["car1960","moto1960","commercial1960","agricultural1960","trailer1977"] },
];

// ── Plate text builder ───────────────────────────────────────────────────────
export function buildCzechPlateText(
  category: CzechCategoryId,
  fields: {
    // 2001 system
    firstDigit?: string;
    regionLetter?: string;
    optionalChar?: string;
    fourDigits?: string;
    // sport/oldtimer
    regionNum?: string;
    // dealer
    dealerLetter?: string;
    // electric
    elDigit?: string;
    // diplomatic
    diplom1?: string;
    diplom2?: string;
    // vanity/export
    custom?: string;
    // 1960 system
    regionCode1960?: string;
    serialLetter?: string;
    num1?: string;
    num2?: string;
  }
): string {
  const f = fields;
  switch (category) {
    case "car2001":
    case "foreign": {
      const d1 = f.firstDigit ?? "";
      const rl = f.regionLetter ?? "";
      const opt = f.optionalChar ?? "";
      const n4 = f.fourDigits ?? "";
      return `${d1}${rl}${opt} ${n4}`.trim().toUpperCase();
    }
    case "moto2001": {
      const d1 = f.firstDigit ?? "";
      const rl = f.regionLetter ?? "";
      const n4 = f.fourDigits ?? "";
      return `${d1}${rl} ${n4}`.trim().toUpperCase();
    }
    case "dealer2001": {
      const dl = f.dealerLetter ?? "";
      const n4 = f.fourDigits ?? "";
      return `${dl} ${n4}`.trim().toUpperCase();
    }
    case "sport2001": {
      const rn = f.regionNum ?? "";
      const n4 = f.fourDigits ?? "";
      return `${rn}R ${n4}`.trim().toUpperCase();
    }
    case "oldtimer2001": {
      const rn = f.regionNum ?? "";
      const n4 = f.fourDigits ?? "";
      return `${rn}V ${n4}`.trim().toUpperCase();
    }
    case "electric": {
      const ed = f.elDigit ?? "";
      const n4 = f.fourDigits ?? "";
      return `EL${ed} ${n4}`.trim().toUpperCase();
    }
    case "diplomatic": {
      const d1 = f.diplom1 ?? "";
      const d2 = f.diplom2 ?? "";
      return `${d1} ${d2}`.trim().toUpperCase();
    }
    case "vanity":
    case "export":
      return (f.custom ?? "").toUpperCase();
    case "car1960":
    case "moto1960":
    case "commercial1960":
    case "agricultural1960":
    case "trailer1977": {
      const rc = f.regionCode1960 ?? "";
      const sl = f.serialLetter ?? "";
      const n1 = f.num1 ?? "";
      const n2 = f.num2 ?? "";
      return `${rc}${sl} ${n1}-${n2}`.trim().toUpperCase();
    }
    default:
      return "";
  }
}
