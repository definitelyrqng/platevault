export interface TagDef {
  id: string;
  label: string;
  group: string;
}

export const TAG_GROUPS = [
  "Emergency & Special Services",
  "Commercial & Heavy Vehicles",
  "Two-Wheelers",
  "Body Style",
  "Special Interest",
  "Plate-Related",
  "Incidents & Situations",
] as const;

export const ALL_TAGS: TagDef[] = [
  // Emergency & Special Services
  { id: "ambulance",          label: "Ambulance",           group: "Emergency & Special Services" },
  { id: "fire-appliance",     label: "Fire appliance",      group: "Emergency & Special Services" },
  { id: "aerial-truck",       label: "Aerial truck",        group: "Emergency & Special Services" },
  { id: "police",             label: "Police",              group: "Emergency & Special Services" },
  { id: "unmarked-emergency", label: "Unmarked emergency",  group: "Emergency & Special Services" },
  { id: "armored",            label: "Armored",             group: "Emergency & Special Services" },

  // Commercial & Heavy Vehicles
  { id: "bus",                label: "Bus",                 group: "Commercial & Heavy Vehicles" },
  { id: "truck",              label: "Truck / Tractor unit",group: "Commercial & Heavy Vehicles" },
  { id: "dump-truck",         label: "Dump truck",          group: "Commercial & Heavy Vehicles" },
  { id: "garbage-truck",      label: "Garbage truck",       group: "Commercial & Heavy Vehicles" },
  { id: "trailer",            label: "Trailer",             group: "Commercial & Heavy Vehicles" },
  { id: "motorhome",          label: "Motorhome",           group: "Commercial & Heavy Vehicles" },

  // Two-Wheelers
  { id: "motorcycle",         label: "Motorcycle",          group: "Two-Wheelers" },
  { id: "moped",              label: "Moped",               group: "Two-Wheelers" },

  // Body Style
  { id: "cabriolet",          label: "Cabriolet",           group: "Body Style" },
  { id: "limousine",          label: "Limousine",           group: "Body Style" },
  { id: "hearse",             label: "Hearse",              group: "Body Style" },
  { id: "wedding",            label: "Wedding car",         group: "Body Style" },

  // Special Interest
  { id: "oldtimer",           label: "Oldtimer",            group: "Special Interest" },
  { id: "tuned",              label: "Tuned",               group: "Special Interest" },
  { id: "spyspot",            label: "Spyspot",             group: "Special Interest" },
  { id: "matching-plate",     label: "Matching plate",      group: "Special Interest" },
  { id: "training-vehicle",   label: "Training vehicle",    group: "Special Interest" },
  { id: "archive",            label: "Archive photo",       group: "Special Interest" },
  { id: "taxi",               label: "Taxicab",             group: "Special Interest" },

  // Plate-Related
  { id: "tampered-plate",     label: "Tampered plate",      group: "Plate-Related" },
  { id: "non-standard-plate", label: "Non-standard plate",  group: "Plate-Related" },
  { id: "reissued-plate",     label: "Reissued plate",      group: "Plate-Related" },

  // Incidents & Situations
  { id: "abandoned",          label: "Abandoned vehicle",   group: "Incidents & Situations" },
  { id: "damaged",            label: "Damaged",             group: "Incidents & Situations" },
  { id: "accident",           label: "Road accident",       group: "Incidents & Situations" },
  { id: "traffic-violation",  label: "Traffic violation",   group: "Incidents & Situations" },
  { id: "illegal-parking",    label: "Illegal parking",     group: "Incidents & Situations" },
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
