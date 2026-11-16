import { catalogPlateTypes } from "./countryPlateTypes";
import { plateTypeLabel } from "./plateTypes";
import { CZECH_CATEGORIES, CZECH_FORMATS, type CzechCategoryId } from "./czechData";
import { AUSTRIA_PLATE_TYPE_LABELS } from "./austriaData";

export type PlateTypeOption = { id: string; label: string; sample: string };

const CZECH_AVAILABLE: CzechCategoryId[] = ["car2001", "moto2001", "dealer2001", "sport2001", "oldtimer2001", "electric", "vanity", "diplomatic", "military", "export", "car1992", "foreign"];

/**
 * Every plate type the site can draw for a country (the same ones its upload form offers), used by the spot editor.
 * Returns null for countries without a list — the editor then shows a plain text field for the type.
 */
export function plateTypeOptions(country: string): PlateTypeOption[] | null {
  const c = country.toLowerCase();
  if (c === "czech") {
    return CZECH_CATEGORIES.filter((cat) => CZECH_AVAILABLE.includes(cat.id)).flatMap((cat) =>
      (CZECH_FORMATS[cat.id] ?? []).map((f) => ({ id: `cz-${cat.id}-${f.id}`, label: `${cat.label} · ${f.label}`, sample: cat.example })));
  }
  if (c === "austria") {
    return Object.entries(AUSTRIA_PLATE_TYPE_LABELS)
      .filter(([id]) => !/moped/.test(id))
      .map(([id, label]) => ({ id, label, sample: "W 12345 A" }));
  }
  const cat = catalogPlateTypes(c);
  if (cat) return cat.map((e) => ({ id: e.type, label: plateTypeLabel(c, e.type) ?? e.type, sample: e.sample }));
  return null;
}
