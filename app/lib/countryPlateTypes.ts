import { BOSNIA_CATEGORIES, BOSNIA_FORMATS_FOR } from "./bosniaData";
import { BELGIUM_CATEGORIES, BELGIUM_FORMATS_FOR } from "./belgiumData";
import { BULGARIA_CATEGORIES, BULGARIA_FORMATS_FOR } from "./bulgariaData";

/**
 * Every plate type a country's upload form offers, with a sample plate text, so the country page
 * can show them all — also the ones nobody has spotted yet.
 */
export function catalogPlateTypes(country: string): { type: string; sample: string }[] | null {
  switch (country.toLowerCase()) {
    case "bosnia":
      return BOSNIA_CATEGORIES.flatMap((c) => BOSNIA_FORMATS_FOR[c.id].map((f) => ({ type: `${c.id}__${f}`, sample: c.example })));
    case "bulgaria":
      return BULGARIA_CATEGORIES.flatMap((c) => BULGARIA_FORMATS_FOR[c.id].map((f) => ({ type: `${c.id}__${f}`, sample: c.example })));
    case "belgium":
      return BELGIUM_CATEGORIES.flatMap((c) =>
        BELGIUM_FORMATS_FOR[c.id].filter((f) => f === "single-dash" || f === "two-line" || f === "military-single").map((f) => ({ type: `${c.id}__${f}`, sample: c.example })));
    default:
      return null;
  }
}
