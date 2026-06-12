/**
 * PlateVault - Car Data
 * Structure: Brand > Model > Generation > { colors }
 *
 * HOW TO ADD A NEW BRAND
 * Copy any existing brand block and register it in CAR_DATA at the bottom.
 *
 * HOW TO ADD A MODEL / GENERATION
 * Add a new key under the brand. Generations are just strings like "X243 (2021-2023)".
 * Always end the colors array with "Custom color" and "Custom wrap".
 *
 * TRIM is now free-text in the upload form - no need to list trims here.
 */

export type GenerationData = {
  colors: string[];
};

export type CarData = Record<
  string,
  Record<string, Record<string, GenerationData>>
>;

// ─── Audi ─────────────────────────────────────────────────────────────────────

const C6_COLORS = [
  "Brilliant Black", "Ibis White", "Mythos Black Metallic",
  "Avus Silver Metallic", "Florett Silver Metallic", "Quartz Grey Metallic",
  "Lava Grey Pearl Effect", "Daytona Grey Pearl Effect", "Meteor Grey Pearl Effect",
  "Condor Grey Metallic", "Teak Brown Metallic", "Deep Sea Blue Pearl Effect",
  "Stratos Blue Metallic", "Brilliant Red", "Custom color", "Custom wrap",
];

const C6_GEN: Record<string, GenerationData> = {
  "C6 (2004–2011)": { colors: C6_COLORS },
};

const C7_GEN: Record<string, GenerationData> = {
  "C7 (2011–2014)": {
    colors: [
      "Brilliant Black", "Glacier White Metallic", "Ibis White",
      "Floret Silver Metallic", "Monsoon Grey Metallic", "Daytona Grey Pearl Effect",
      "Sepang Blue Pearl Effect", "Scuba Blue Metallic", "Estoril Blue Crystal Effect",
      "Panther Black Crystal Effect", "Havana Black Metallic",
      "Custom color", "Custom wrap",
    ],
  },
  "C7 Facelift (2014–2018)": {
    colors: [
      "Brilliant Black", "Glacier White Metallic", "Ibis White",
      "Floret Silver Metallic", "Monsoon Grey Metallic", "Daytona Grey Pearl Effect",
      "Mythos Black Metallic", "Nardo Grey", "Quantum Grey Pearl Effect",
      "Scuba Blue Metallic", "Panther Black Crystal Effect", "Navarra Blue Metallic",
      "Custom color", "Custom wrap",
    ],
  },
};

const AUDI: CarData["Audi"] = {
  "A6 Sedan": { ...C6_GEN, ...C7_GEN },
  "A6 Avant": { ...C6_GEN, ...C7_GEN },
};

// ─── Mercedes-Benz ────────────────────────────────────────────────────────────

const MB_EQB_COLORS = [
  "Polar White", "Obsidian Black Metallic", "High-Tech Silver Metallic",
  "Graphite Grey Metallic", "Mountain Grey Metallic", "Spectral Blue Metallic",
  "Manufaktur Hyacinth Red Metallic", "Custom color", "Custom wrap",
];

const MERCEDES_BENZ: CarData["Mercedes-Benz"] = {
  EQB: {
    "X243 (2021–2023)":         { colors: MB_EQB_COLORS },
    "X243 Facelift (2023–2025)": { colors: MB_EQB_COLORS },
  },
};

// ─── Schmitz ──────────────────────────────────────────────────────────────────

const SCHMITZ: CarData["Schmitz"] = {
  Cargobull: {
    Standard: {
      colors: ["Black", "White", "Multicolor", "Custom color", "Custom wrap"],
    },
  },
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export const CAR_DATA: CarData = {
  Audi:            AUDI,
  "Mercedes-Benz": MERCEDES_BENZ,
  Schmitz:         SCHMITZ,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const BRANDS = Object.keys(CAR_DATA).sort();

export function getModels(brand: string): string[] {
  return Object.keys(CAR_DATA[brand] ?? {}).sort();
}

export function getGenerations(brand: string, model: string): string[] {
  return Object.keys(CAR_DATA[brand]?.[model] ?? {});
}

export function getColors(brand: string, model: string, gen: string): string[] {
  return CAR_DATA[brand]?.[model]?.[gen]?.colors ?? ["Custom color", "Custom wrap"];
}
