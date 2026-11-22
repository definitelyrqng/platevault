import { normalisePlateText } from "./plateText";

/**
 * Statistics count vehicles, not photos: a plate that was spotted several times (a Multi Spot, or a front
 * and a rear photo of the same car) counts once. The exception is a sighting tagged as a transferred /
 * re-registered plate — the plate moved to another vehicle, so that sighting is its own vehicle.
 */
export const TRANSFER_TAG = "reissued-plate";

export type VehicleRow = { id: string; country: string; plateText: string; tags?: string[] | null };

/** What identifies the vehicle behind a sighting. */
export function vehicleKey(r: VehicleRow): string {
  if (r.tags?.includes(TRANSFER_TAG)) return `id:${r.id}`;
  return `${r.country.toLowerCase()}|${normalisePlateText(r.country, r.plateText).replace(/[\s-]+/g, "")}`;
}

/** One row per vehicle (the first one in the given order is kept). */
export function distinctVehicles<T extends VehicleRow>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = vehicleKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Vehicles per group (brand, model, country, …); a vehicle counts once inside each group. */
export function countVehiclesBy<T extends VehicleRow>(rows: T[], group: (r: T) => string | null | undefined): Map<string, number> {
  const seen = new Map<string, Set<string>>();
  for (const r of rows) {
    const g = group(r);
    if (!g) continue;
    const set = seen.get(g) ?? new Set<string>();
    set.add(vehicleKey(r));
    seen.set(g, set);
  }
  return new Map([...seen].map(([g, s]) => [g, s.size]));
}

export function countVehicles(rows: VehicleRow[]): number {
  return new Set(rows.map(vehicleKey)).size;
}
