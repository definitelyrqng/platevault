import fs from "fs";
import path from "path";
import { isRegionMapCountry, REGION_MAP_FILE } from "./regionMaps";

type File = { areas: { n: string; c: string[] }[] };
const cache = new Map<string, File>();

/** Names of the map units that contain the given plate codes ("Munich", "Zagreb" …), for page headings. */
export function regionNamesOf(country: string, codes: string[]): string[] {
  if (!isRegionMapCountry(country)) return [];
  let f = cache.get(country);
  if (!f) {
    try { f = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", REGION_MAP_FILE[country]), "utf8")) as File; cache.set(country, f); } catch { return []; }
  }
  const set = new Set(codes);
  return [...new Set(f.areas.filter((a) => a.c.some((c) => set.has(c))).map((a) => a.n))];
}
