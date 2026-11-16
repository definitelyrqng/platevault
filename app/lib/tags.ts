export interface TagDef {
  id: string;
  label: string;
  group: string;
}

// Tag ids are stored on spots and used in /tags/<id> URLs — never change an id, only its label or group.
export const TAG_GROUPS = [
  "On Duty",
  "Heavy & Work",
  "Two Wheels & More",
  "Body & Style",
  "Mods & Extras",
  "Plate Quirks",
  "Rare Finds",
  "Street Life",
] as const;

export const ALL_TAGS: TagDef[] = [
  // On Duty
  { id: "ambulance",          label: "Ambulance",           group: "On Duty" },
  { id: "fire-appliance",     label: "Fire engine",         group: "On Duty" },
  { id: "aerial-truck",       label: "Ladder truck",        group: "On Duty" },
  { id: "police",             label: "Police",              group: "On Duty" },
  { id: "unmarked-emergency", label: "Undercover",          group: "On Duty" },
  { id: "armored",            label: "Armoured",            group: "On Duty" },
  { id: "cash-in-transit",    label: "Cash transport",      group: "On Duty" },
  { id: "tow-truck",          label: "Recovery truck",      group: "On Duty" },
  { id: "taxi",               label: "Cab",                 group: "On Duty" },
  { id: "training-vehicle",   label: "Driving school",      group: "On Duty" },
  { id: "rental",             label: "Rental",              group: "On Duty" },

  // Heavy & Work
  { id: "bus",                label: "Bus / coach",         group: "Heavy & Work" },
  { id: "truck",              label: "Lorry / tractor unit",group: "Heavy & Work" },
  { id: "dump-truck",         label: "Tipper",              group: "Heavy & Work" },
  { id: "garbage-truck",      label: "Refuse truck",        group: "Heavy & Work" },
  { id: "trailer",            label: "Trailer",             group: "Heavy & Work" },
  { id: "delivery-van",       label: "Delivery van",        group: "Heavy & Work" },
  { id: "construction",       label: "Building site",       group: "Heavy & Work" },
  { id: "excavator",          label: "Digger",              group: "Heavy & Work" },
  { id: "crane-truck",        label: "Crane truck",         group: "Heavy & Work" },
  { id: "tanker",             label: "Tanker",              group: "Heavy & Work" },
  { id: "food-truck",         label: "Food truck",          group: "Heavy & Work" },
  { id: "tractor",            label: "Tractor",             group: "Heavy & Work" },

  // Two Wheels & More
  { id: "motorcycle",         label: "Motorcycle",          group: "Two Wheels & More" },
  { id: "moped",              label: "Moped",               group: "Two Wheels & More" },
  { id: "atv",                label: "Quad",                group: "Two Wheels & More" },
  { id: "trike",              label: "Trike",               group: "Two Wheels & More" },

  // Body & Style
  { id: "cabriolet",          label: "Convertible",         group: "Body & Style" },
  { id: "limousine",          label: "Stretch limo",        group: "Body & Style" },
  { id: "hearse",             label: "Hearse",              group: "Body & Style" },
  { id: "wedding",            label: "Wedding ride",        group: "Body & Style" },
  { id: "motorhome",          label: "Motorhome",           group: "Body & Style" },
  { id: "camper",             label: "Camper van",          group: "Body & Style" },
  { id: "electric",           label: "Electric",            group: "Body & Style" },

  // Mods & Extras
  { id: "tuned",              label: "Modified",            group: "Mods & Extras" },
  { id: "lowered",            label: "Lowered / stanced",   group: "Mods & Extras" },
  { id: "offroad",            label: "Lifted / off-road",   group: "Mods & Extras" },
  { id: "wrapped",            label: "Wrapped",             group: "Mods & Extras" },
  { id: "aerography",         label: "Custom paint",        group: "Mods & Extras" },
  { id: "roofbox",            label: "Roofbox",             group: "Mods & Extras" },
  { id: "roof-rack",          label: "Roof rack / cargo",   group: "Mods & Extras" },
  { id: "bike-rack",          label: "Bike rack",           group: "Mods & Extras" },

  // Plate Quirks
  { id: "matching-plate",     label: "Matching plate",      group: "Plate Quirks" },
  { id: "new-combination",    label: "Fresh combination",   group: "Plate Quirks" },
  { id: "non-standard-plate", label: "Unofficial plate",    group: "Plate Quirks" },
  { id: "tampered-plate",     label: "Altered plate",       group: "Plate Quirks" },
  { id: "reissued-plate",     label: "Re-registered",       group: "Plate Quirks" },
  { id: "remade-plate",       label: "Replica plate",       group: "Plate Quirks" },

  // Rare Finds
  { id: "spyspot",            label: "Spy shot",            group: "Rare Finds" },
  { id: "test-drive",         label: "Prototype / test car",group: "Rare Finds" },
  { id: "oldtimer",           label: "Classic",             group: "Rare Finds" },
  { id: "archive",            label: "From the archive",    group: "Rare Finds" },

  // Street Life
  { id: "abandoned",          label: "Abandoned",           group: "Street Life" },
  { id: "damaged",            label: "Damaged",             group: "Street Life" },
  { id: "accident",           label: "Crash",               group: "Street Life" },
  { id: "traffic-violation",  label: "Rule breaker",        group: "Street Life" },
  { id: "illegal-parking",    label: "Bad parking",         group: "Street Life" },
];

export const TAG_IDS = new Set(ALL_TAGS.map((t) => t.id));

export function tagById(id: string): TagDef | undefined {
  return ALL_TAGS.find((t) => t.id === id);
}

/** Validate and filter an array of tag ids — only known tags pass */
export function sanitizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set((raw as unknown[]).filter((t): t is string => typeof t === "string" && TAG_IDS.has(t)))];
}

/** Plate types that are electric-vehicle plates (Czech EL…, German E suffix, Austrian electric, …). */
export function isElectricPlateType(plateType?: string | null) {
  return /electric/i.test(plateType ?? "");
}

/** The tags a spot always has because of its plate type — currently "electric" for electric plates. */
export function withAutoTags(tags: string[], plateType?: string | null): string[] {
  return isElectricPlateType(plateType) && !tags.includes("electric") ? [...tags, "electric"] : tags;
}
