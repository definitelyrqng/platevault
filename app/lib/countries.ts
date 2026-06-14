export const COUNTRY_META: Record<string, { iso: string; name: string }> = {
  albania:     { iso: "al", name: "Albania" },
  austria:     { iso: "at", name: "Austria" },
  belgium:     { iso: "be", name: "Belgium" },
  bosnia:      { iso: "ba", name: "Bosnia & Herzegovina" },
  france:      { iso: "fr", name: "France" },
  germany:     { iso: "de", name: "Germany" },
  greece:      { iso: "gr", name: "Greece" },
  italy:       { iso: "it", name: "Italy" },
  kosovo:      { iso: "xk", name: "Kosovo" },
  netherlands: { iso: "nl", name: "Netherlands" },
  poland:      { iso: "pl", name: "Poland" },
  spain:       { iso: "es", name: "Spain" },
  switzerland: { iso: "ch", name: "Switzerland" },
};

export function getCountryMeta(country: string): { iso: string | null; name: string } {
  return COUNTRY_META[country.toLowerCase()] ?? {
    iso: null,
    name: country.charAt(0).toUpperCase() + country.slice(1),
  };
}
