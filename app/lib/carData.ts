export type GenerationData = Record<string, never>;

export type CarData = Record<
  string,
  Record<string, Record<string, GenerationData>>
>;

// ─── Audi ─────────────────────────────────────────────────────────────────────

const AUDI: CarData["Audi"] = {
  "A6 Sedan": {
    "3rd Gen (4F2/C6) (2004-2008)": {},
    "3rd Gen Facelift (4F2/C6) (2008-2011)": {},
    "4th Gen (4G2/C7) (2011-2014)": {},
    "4th Gen Facelift (4GC/C7.5) (2014-2018)": {},
    "5th Gen (4K2/C8) (2018-2023)": {},
    "5th Gen Facelift (4K2/C8) (2023-)": {},
  },
  "A6 Avant": {
    "3rd Gen (4F5/C6) (2005-2008)": {},
    "3rd Gen Facelift (4F5/C6) (2008-2011)": {},
    "4th Gen (4G5/C7) (2011-2014)": {},
    "4th Gen Facelift (4GD/C7.5) (2014-2018)": {},
    "5th Gen (4K5/C8) (2018-2023)": {},
    "5th Gen Facelift (4K5/C8) (2023-)": {},
  },
  "A8": {
    "4th Gen (4N/D5) (2017-2021)": {},
    "4th Gen Facelift (4N/D5.5) (2021-2026)": {},
  },
  "A8 L": {
    "4th Gen (4N/D5) (2017-2021)": {},
    "4th Gen Facelift (4N/D5.5) (2021-2026)": {},
    "4th Gen Facelift Horch Founders Edition (4N/D5.5) (2021-2026)": {},
  },
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
  X3: {
    "3rd Gen (G01) (2017-2021)": {},
    "3rd Gen Facelift (G01 LCI) (2021-2024)": {},
  },
  X1: {
    "2nd Gen (F48) (2015-2019)": {},
    "2nd Gen Facelift (F48 LCI) (2019-2022)": {},
  },
  "3 Series": {
    "5th Gen Sedan (E90) (2005-2008)": {},
    "5th Gen Sedan Facelift (E90 LCI) (2008-2011)": {},
    "5th Gen Touring (E91) (2005-2008)": {},
    "5th Gen Touring Facelift (E91 LCI) (2008-2012)": {},
    "5th Gen Coupe (E92) (2006-2010)": {},
    "5th Gen Coupe Facelift (E92 LCI) (2010-2013)": {},
    "5th Gen Convertible (E93) (2006-2010)": {},
    "5th Gen Convertible Facelift (E93 LCI) (2010-2013)": {},
    "7th Gen Sedan (G20) (2018-2022)": {},
    "7th Gen Touring (G21) (2018-2022)": {},
    "7th Gen Sedan Facelift (G20 LCI) (2022-)": {},
    "7th Gen Touring Facelift (G21 LCI) (2022-)": {},
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

// ─── Citroën ────────────────────────────────────────────────────────────────────

const CITROEN: CarData["Citroën"] = {
  "C5 Aircross": {
    "1st Gen (C84) (2018-2022)": {},
    "1st Gen Facelift (C84) (2022-2025)": {},
  },
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export const CAR_DATA: CarData = {
  "Citroën":       CITROEN,
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
