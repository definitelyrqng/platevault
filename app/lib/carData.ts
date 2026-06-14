export type GenerationData = Record<string, never>;

export type CarData = Record<
  string,
  Record<string, Record<string, GenerationData>>
>;

// ─── Audi ─────────────────────────────────────────────────────────────────────

const C6_GEN: Record<string, GenerationData> = {
  "C6 (2004-2011)": {},
};

const C7_GEN: Record<string, GenerationData> = {
  "C7 (2011-2014)": {},
  "C7 Facelift (2014-2018)": {},
};

const AUDI: CarData["Audi"] = {
  "A6 Sedan": { ...C6_GEN, ...C7_GEN, "5th Gen (4K2/C8) (2018-2023)": {}, "5th Gen Facelift (4K2/C8) (2023-)": {} },
  "A6 Avant": { ...C6_GEN, ...C7_GEN, "5th Gen (4K5/C8) (2018-2023)": {}, "5th Gen Facelift (4K5/C8) (2023-)": {} },
  "A6 Allroad": {
    "4th Gen (4K9/C8) (2019-2023)": {},
    "4th Gen Facelift (4K9/C8) (2023-)": {},
  },
  "A7 Sportback": {
    "2nd Gen (4K8/C8) (2018-2023)": {},
    "2nd Gen Facelift (4K8/C8) (2023-2025)": {},
  },
  "RS5 Sportback": {
    "2nd Gen (B9) (2017-2019)": {},
    "2nd Gen Facelift (B9.5) (2020-2024)": {},
  },
  "A3 Sportback": {
    "4th Gen (8YA) (2020-2024)": {},
    "4th Gen Facelift (8YF) (2024-)": {},
  },
  "A3 Allstreet": {
    "1st Gen (8YH) (2024-)": {},
  },
  "A4 Sedan": {
    "4th Gen (8K2/B8) (2007-2011)": {},
    "4th Gen Facelift (8K2/B8.5) (2011-2015)": {},
    "5th Gen (8W2/B9) (2015-2019)": {},
    "5th Gen Facelift (8WC/B9.5) (2019-2024)": {},
  },
  "A4 Avant": {
    "4th Gen (8K5/B8) (2008-2012)": {},
    "4th Gen Facelift (8K5/B8.5) (2011-2015)": {},
    "5th Gen (8W5/B9) (2015-2019)": {},
    "5th Gen Facelift (8WD/B9.5) (2019-2024)": {},
  },
};

// ─── Fiat ─────────────────────────────────────────────────────────────────────

const FIAT: CarData["Fiat"] = {
  Talento: {
    "2nd Gen (296) (2016-2020)": {},
  },
};

// ─── BMW ──────────────────────────────────────────────────────────────────────

const BMW: CarData["BMW"] = {
  XM: {
    "1st Gen (G09) (2022-)": {},
  },
};

// ─── Lotus ────────────────────────────────────────────────────────────────────

const LOTUS: CarData["Lotus"] = {
  Evora: {
    "1st Gen (Type 122) (2009-2014)": {},
    "1st Gen Facelift (Type 122) (2015-2021)": {},
  },
};

// ─── Mercedes-Benz ────────────────────────────────────────────────────────────

const MERCEDES_BENZ: CarData["Mercedes-Benz"] = {
  EQB: {
    "X243 (2021-2023)": {},
    "X243 Facelift (2023-2025)": {},
  },
};

// ─── Schmitz ──────────────────────────────────────────────────────────────────

const SCHMITZ: CarData["Schmitz"] = {
  Cargobull: {
    Standard: {},
  },
};

// ─── Porsche ──────────────────────────────────────────────────────────────────

const PORSCHE: CarData["Porsche"] = {
  Taycan: {
    "1st Gen Sport Turismo (9J1) (2021-2024)": {},
  },
};

// ─── Skoda ────────────────────────────────────────────────────────────────────

const SKODA: CarData["Skoda"] = {
  Elroq: {
    "1st Gen (2025-)": {},
  },
  Enyaq: {
    "1st Gen iV SUV (NY) (2020-)": {},
  },
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export const CAR_DATA: CarData = {
  Audi:            AUDI,
  BMW:             BMW,
  Fiat:            FIAT,
  Lotus:           LOTUS,
  "Mercedes-Benz": MERCEDES_BENZ,
  Schmitz:         SCHMITZ,
  Porsche:         PORSCHE,
  Skoda:           SKODA,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const BRANDS = Object.keys(CAR_DATA).sort();

export function getModels(brand: string): string[] {
  return Object.keys(CAR_DATA[brand] ?? {}).sort();
}

export function getGenerations(brand: string, model: string): string[] {
  return Object.keys(CAR_DATA[brand]?.[model] ?? {});
}
