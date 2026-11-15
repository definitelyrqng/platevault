import { BOSNIA_CATEGORIES, BOSNIA_FORMATS_FOR } from "./bosniaData";
import { BELGIUM_CATEGORIES, BELGIUM_FORMATS_FOR } from "./belgiumData";
import { BULGARIA_CATEGORIES, BULGARIA_FORMATS_FOR } from "./bulgariaData";
import { CROATIA_CATEGORIES } from "./croatiaData";

/**
 * Every plate type a country's upload form offers, with a sample plate text, so the country page
 * can show them all — also the ones nobody has spotted yet.
 */
export function catalogPlateTypes(country: string): { type: string; sample: string }[] | null {
  switch (country.toLowerCase()) {
    case "bosnia":
      return BOSNIA_CATEGORIES.flatMap((c) => BOSNIA_FORMATS_FOR[c.id].map((f) => ({ type: `${c.id}__${f}`, sample: c.example })));
    case "croatia":     // the types that have artwork so far
      return CROATIA_CATEGORIES.filter((c) => ["regular", "foreign", "exceptional", "motorcycle", "vanity", "dealer", "oldtimer", "military", "export", "police", "diplomatic"].includes(c.id))
        .flatMap((c) => (c.id === "motorcycle" ? ["triple-row-euroband", "triple-row"] : ["single-line-euroband", "single-line"])
          .map((f) => ({ type: `${c.id}__${f}`, sample: c.id === "motorcycle" ? "ZG 9619 GU" : c.example })));
    case "bulgaria":
      return BULGARIA_CATEGORIES.flatMap((c) => BULGARIA_FORMATS_FOR[c.id].map((f) => ({ type: `${c.id}__${f}`, sample: c.example })));
    case "belgium":
      return BELGIUM_CATEGORIES.flatMap((c) =>
        BELGIUM_FORMATS_FOR[c.id].filter((f) => f === "single-dash" || f === "two-line" || f === "military-single").map((f) => ({ type: `${c.id}__${f}`, sample: c.example })));
    default:
      return null;
  }
}
