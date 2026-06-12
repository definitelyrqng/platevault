export type AlbaniaRegion = {
  code: string;  // plate prefix, e.g. "AA"
  city: string;  // e.g. "Tirana"
  county: string; // Albanian county (qark), e.g. "Tirana"
};

export const ALBANIA_REGIONS: AlbaniaRegion[] = [
  { code: "AA", city: "Tirana",    county: "Tirana" },
  // more coming soon
];

const BY_CODE = new Map(ALBANIA_REGIONS.map((r) => [r.code, r]));

export function getAlbaniaRegion(code: string): AlbaniaRegion | undefined {
  return BY_CODE.get(code.toUpperCase());
}

/** Try to auto-detect region code from the plate text (first 2 chars) */
export function detectAlbaniaRegion(plateText: string): AlbaniaRegion | undefined {
  const prefix = plateText.slice(0, 2).toUpperCase();
  return BY_CODE.get(prefix);
}
