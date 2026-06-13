export type AlbaniaRegion = {
  code: string;
  city: string;
  district: string;
};

/** Region codes ONLY apply to Cars (1993-2010) plates */
export const ALBANIA_REGIONS: AlbaniaRegion[] = [
  { code: "BC", city: "Tropoj\u00eb",        district: "Tropoj\u00eb District" },
  { code: "BR", city: "Berat",           district: "Berat District" },
  { code: "BZ", city: "Bulqiz\u00eb",        district: "Bulqiz\u00eb District" },
  { code: "DI", city: "Dib\u00ebr",          district: "Dib\u00ebr District" },
  { code: "DL", city: "Delvin\u00eb",        district: "Delvin\u00eb District" },
  { code: "DR", city: "Durr\u00ebs",         district: "Durr\u00ebs District" },
  { code: "DV", city: "Devoll",          district: "Devoll District" },
  { code: "EL", city: "Elbasan",         district: "Elbasan District" },
  { code: "ER", city: "Kolonj\u00eb",        district: "Kolonj\u00eb District" },
  { code: "FR", city: "Fier",            district: "Fier District" },
  { code: "GJ", city: "Gjirokastr\u00ebr",   district: "Gjirokastr\u00ebr District" },
  { code: "GR", city: "Gramsh",          district: "Gramsh District" },
  { code: "HS", city: "Has",             district: "Has District" },
  { code: "KJ", city: "Kavaj\u00eb",         district: "Kavaj\u00eb District" },
  { code: "KO", city: "Kor\u00e7\u00eb",         district: "Kor\u00e7\u00eb District" },
  { code: "KR", city: "Kruj\u00eb",          district: "Kruj\u00eb District" },
  { code: "KU", city: "Kuk\u00ebs",          district: "Kuk\u00ebs District" },
  { code: "KV", city: "Ku\u00e7ov\u00eb",        district: "Ku\u00e7ov\u00eb District" },
  { code: "LA", city: "Kurbin",          district: "Kurbin District" },
  { code: "LB", city: "Librazhd",        district: "Librazhd District" },
  { code: "LE", city: "Lezh\u00eb",          district: "Lezh\u00eb District" },
  { code: "LU", city: "Lushnj\u00eb",        district: "Lushnj\u00eb District" },
  { code: "MA", city: "Mal\u00ebsi e Madhe", district: "Mal\u00ebsi e Madhe District" },
  { code: "MK", city: "Mallakastr\u00ebr",   district: "Mallakastr\u00ebr District" },
  { code: "MR", city: "Mirdit\u00eb",        district: "Mirdit\u00eb District" },
  { code: "MT", city: "Mat",             district: "Mat District" },
  { code: "PE", city: "Peqin",           district: "Peqin District" },
  { code: "PG", city: "Pogradec",        district: "Pogradec District" },
  { code: "PR", city: "P\u00ebrmet",         district: "P\u00ebrmet District" },
  { code: "PU", city: "Puk\u00eb",           district: "Puk\u00eb District" },
  { code: "SH", city: "Shkod\u00ebr",        district: "Shkod\u00ebr District" },
  { code: "SK", city: "Skrapar",         district: "Skrapar District" },
  { code: "SR", city: "Sarand\u00eb",        district: "Sarand\u00eb District" },
  { code: "TP", city: "Tepelen\u00eb",       district: "Tepelen\u00eb District" },
  { code: "TR", city: "Tiran\u00eb",         district: "Tiran\u00eb District" },
  { code: "VL", city: "Vlor\u00eb",          district: "Vlor\u00eb District" },
];

const BY_CODE = new Map(ALBANIA_REGIONS.map((r) => [r.code, r]));

export function getAlbaniaRegion(code: string): AlbaniaRegion | undefined {
  return BY_CODE.get(code.toUpperCase());
}

export const ALBANIA_PLATE_TYPE_LABELS: Record<string, string> = {
  "car-2011-standard":   "Standard single line (2011+)",
  "car-2011-double":     "Double line (2011+)",
  "car-2011-us":         "US-size single line (2011+)",
  "moto-2011":           "Motorcycle plate (2011+)",
  "trailer-2011-single": "Trailer single line (2011+)",
  "trailer-2011-double": "Trailer double line (2011+)",
  "car-1993-single":     "Old format single line (1993-2010)",
  "car-1993-double":     "Old format double line (1993-2010)",
};
