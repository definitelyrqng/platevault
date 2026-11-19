/** Countries that have a region map (/c/<country>/map) and how a spot is placed on it. */
export const REGION_MAP_COUNTRIES = ["germany", "austria", "czech", "bulgaria", "croatia", "albania"] as const;
export type RegionMapCountry = (typeof REGION_MAP_COUNTRIES)[number];

export const isRegionMapCountry = (c: string): c is RegionMapCountry => (REGION_MAP_COUNTRIES as readonly string[]).includes(c);

/** The map file of a country (public/data), and what one unit of it is called. */
export const REGION_MAP_FILE: Record<RegionMapCountry, string> = {
  germany: "/data/germany-districts.json", austria: "/data/austria-regions.json", czech: "/data/czech-regions.json",
  bulgaria: "/data/bulgaria-regions.json", croatia: "/data/croatia-regions.json", albania: "/data/albania-regions.json",
};
export const REGION_UNIT: Record<RegionMapCountry, { singular: string; plural: string; title: string }> = {
  germany: { singular: "district", plural: "districts", title: "Plate map of Germany" },
  austria: { singular: "district", plural: "districts", title: "Plate map of Austria" },
  czech: { singular: "region", plural: "regions", title: "Plate map of Czechia" },
  bulgaria: { singular: "province", plural: "provinces", title: "Plate map of Bulgaria" },
  croatia: { singular: "county", plural: "counties", title: "Plate map of Croatia" },
  albania: { singular: "county", plural: "counties", title: "Plate map of Albania" },
};

/** Countries whose spots do not store a region: it is read from the start of the plate. */
export const REGION_FROM_TEXT = new Set<string>(["bulgaria", "croatia", "albania"]);

/** The plate code (district / region) a spot belongs to, or null. */
export function regionCodeOf(country: string, plateText: string, plateRegion: string | null): string | null {
  if (plateRegion) return plateRegion.toUpperCase();
  if (!REGION_FROM_TEXT.has(country)) return null;
  const t = plateText.trim().toUpperCase();
  const m = country === "bulgaria" ? t.match(/^([A-Z]{1,2})\s?\d/) : country === "croatia" ? t.match(/^([A-ZČĆŽŠĐ]{2})[\s-]?\d/) : t.match(/^([A-Z]{2})\s?\d/);
  return m ? m[1] : null;
}
