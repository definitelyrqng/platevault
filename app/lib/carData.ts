/**
 * ─────────────────────────────────────────────────────────────────────
 *  PlateVault — Car Data
 *  Structure: Brand → Model → Generation → { trims, colors }
 *
 *  HOW TO ADD A NEW BRAND
 *  ──────────────────────
 *  Copy the Audi block and replace with your brand's data.
 *  Add it as a new key in the CAR_DATA object at the bottom.
 *
 *  HOW TO ADD A NEW MODEL
 *  ──────────────────────
 *  Under the brand, add a new key: "A4": { ...generations }
 *
 *  HOW TO ADD A GENERATION
 *  ────────────────────────
 *  Under the model, add: "B9 (2015–2018)": { trims: [...], colors: [...] }
 *  Always end the colors array with "Custom color" and "Custom wrap".
 *
 *  EXAMPLE ENTRY (copy this pattern):
 *
 *  "3 Series": {
 *    "E90 (2005–2012)": {
 *      trims: ["SE", "M Sport", "Luxury"],
 *      colors: ["Alpine White", "Black Sapphire", "Custom color", "Custom wrap"],
 *    },
 *  },
 * ─────────────────────────────────────────────────────────────────────
 */

export type GenerationData = {
  trims: string[];
  colors: string[];
};

export type CarData = Record<
  string,                          // Brand  (e.g. "Audi")
  Record<
    string,                        // Model  (e.g. "A6 Sedan")
    Record<string, GenerationData> // Gen    (e.g. "C7 (2011–2014)")
  >
>;

// ─── SHARED GENERATION DATA ───────────────────────────────────────────────

const C6_COLORS = [
  "Brilliant Black",
  "Ibis White",
  "Mythos Black Metallic",
  "Avus Silver Metallic",
  "Florett Silver Metallic",
  "Quartz Grey Metallic",
  "Lava Grey Pearl Effect",
  "Daytona Grey Pearl Effect",
  "Meteor Grey Pearl Effect",
  "Condor Grey Metallic",
  "Teak Brown Metallic",
  "Deep Sea Blue Pearl Effect",
  "Stratos Blue Metallic",
  "Brilliant Red",
  "Custom color",
  "Custom wrap",
];

const C6_GEN: Record<string, GenerationData> = {
  // ── 5th Generation (C6) ───────────────────────────────────────────────
  "C6 (2004–2011)": {
    trims: [
      "Standard",
      "SE / Comfort / Attraction / Ambiente",
      "S Line",
    ],
    colors: C6_COLORS,
  },
};

const C7_GEN: Record<string, GenerationData> = {
  // ── 6th Generation (C7) ───────────────────────────────────────────────
  "C7 (2011–2014)": {
    trims: [
      "SE",
      "SE Executive",
      "S Line",
      "S Line Plus",
      "Black Edition",
      "Ultra",
      "Prestige",
    ],
    colors: [
      "Brilliant Black",
      "Glacier White Metallic",
      "Ibis White",
      "Floret Silver Metallic",
      "Monsoon Grey Metallic",
      "Daytona Grey Pearl Effect",
      "Sepang Blue Pearl Effect",
      "Scuba Blue Metallic",
      "Estoril Blue Crystal Effect",
      "Panther Black Crystal Effect",
      "Havana Black Metallic",
      "Custom color",
      "Custom wrap",
    ],
  },

  // ── 6th Generation Facelift (C7.5) ───────────────────────────────────
  "C7 Facelift (2014–2018)": {
    trims: [
      "SE",
      "SE Executive",
      "Sport",
      "S Line",
      "S Line Plus",
      "Black Edition",
      "Ultra",
      "Prestige",
    ],
    colors: [
      "Brilliant Black",
      "Glacier White Metallic",
      "Ibis White",
      "Floret Silver Metallic",
      "Monsoon Grey Metallic",
      "Daytona Grey Pearl Effect",
      "Mythos Black Metallic",
      "Nardo Grey",
      "Quantum Grey Pearl Effect",
      "Scuba Blue Metallic",
      "Panther Black Crystal Effect",
      "Navarra Blue Metallic",
      "Custom color",
      "Custom wrap",
    ],
  },
};

// ─── Audi ────────────────────────────────────────────────────────────────────

const AUDI: CarData["Audi"] = {
  "A6 Sedan": { ...C6_GEN, ...C7_GEN },
  "A6 Avant": { ...C6_GEN, ...C7_GEN },

  // ── Add more Audi models below ──────────────────────────────────────
  // A4: {
  //   "B8 (2008–2012)": {
  //     trims: ["SE", "S Line", "Black Edition"],
  //     colors: ["Ibis White", "Brilliant Black", "Custom color", "Custom wrap"],
  //   },
  // },
};

// ─── MAIN EXPORT — add new brands here ───────────────────────────────────────────
export const CAR_DATA: CarData = {
  Audi: AUDI,

  // BMW: BMW,
  // Mercedes: MERCEDES,
  // Volkswagen: VW,
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
export const BRANDS = Object.keys(CAR_DATA).sort();

export function getModels(brand: string): string[] {
  return Object.keys(CAR_DATA[brand] ?? {}).sort();
}

export function getGenerations(brand: string, model: string): string[] {
  return Object.keys(CAR_DATA[brand]?.[model] ?? {});
}

export function getTrims(brand: string, model: string, gen: string): string[] {
  return CAR_DATA[brand]?.[model]?.[gen]?.trims ?? [];
}

export function getColors(brand: string, model: string, gen: string): string[] {
  return CAR_DATA[brand]?.[model]?.[gen]?.colors ?? ["Custom color", "Custom wrap"];
}
