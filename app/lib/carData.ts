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
  "A6 Sedan": { ...C6_GEN, ...C7_GEN },
  "A6 Avant": { ...C6_GEN, ...C7_GEN },
  "A7 Sportback": {
    "2nd Gen (4K8/C8) (2018-2023)": {},
    "2nd Gen Facelift (4K8/C8) (2023-2025)": {},
  },
  "RS5 Sportback": {
    "2nd Gen (B9) (2017-2019)": {},
    "2nd Gen Facelift (B9.5) (2020-2024)": {},
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
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export const CAR_DATA: CarData = {
  Audi:            AUDI,
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
