/**
 * Plate geometry shared by the <PlateBadge> component and the /api/plate image
 * route, so the page reserves exactly the size of the baked PNG.
 *
 * Pure data + math only (no React, no fs) — safe to import anywhere.
 */

export type Box = { x0: number; x1: number };

/** One line of writing on the plate: its vertical extent and the slots text is centred in. */
export type ArtRow = { y0: number; y1: number; boxes: Box[] };

/**
 * How plate text is divided over the slots (all slots of all rows, in order):
 *  - "whole":     everything in one slot (rows' slots merged)
 *  - "seal":      first letter group | rest            ("AB 195 IF" → AB | 195 IF)
 *  - "al-double": letters | digits | final letters     ("AB 123 CD" → AB | 123 | CD)
 */
export type SplitRule = "whole" | "seal" | "al-double";

export type PlateArt = {
  src: string;          // path under /public
  w: number;            // image width (px)
  h: number;            // image height (px)
  rows: ArtRow[];
  split: SplitRule;
};

/**
 * Real plate artwork. Keys are "<country>" (the default for that country) or
 * "<country>:<plateType>" for a specific plate type, e.g. "albania:trailer-2011-single".
 *
 * To add one: drop the PNG into /public/plates/<country>/, measure its writable
 * area (and seal, if any) in image pixels, and add an entry here. Keep the black
 * rounded border consistent with the other plates of that country.
 */
export const PLATE_ART: Record<string, PlateArt> = {
  // cars_current_single.png (1000×221): white area x108–899, y14–205, seal x365–401.
  albania: {
    src: "/plates/albania/cars_current_single.png",
    w: 1000,
    h: 221,
    rows: [{ y0: 14, y1: 205, boxes: [{ x0: 120, x1: 355 }, { x0: 411, x1: 889 }] }],
    split: "seal",
  },
  // trailer_single.png (1598×354): teal area x177–1420, y21–332, seal x583–635.
  "albania:trailer-2011-single": {
    src: "/plates/albania/trailer_single.png",
    w: 1598,
    h: 354,
    rows: [{ y0: 21, y1: 332, boxes: [{ x0: 191, x1: 573 }, { x0: 645, x1: 1408 }] }],
    split: "seal",
  },
};

/** Artwork for a plate: its exact type first, then the country default. */
export function plateArtFor(country: string, plateType?: string | null): PlateArt | null {
  const key = country.toLowerCase();
  return (plateType && PLATE_ART[`${key}:${plateType}`]) || PLATE_ART[key] || null;
}

export const PLATE_HEIGHTS = { xs: 20, sm: 28, md: 38, lg: 58, xl: 86 } as const;
export type PlateSize = keyof typeof PLATE_HEIGHTS;

/* ── FE-Schrift metrics (from assets/fonts/FE-FONT.ttf, units per 1000 em) ── */
export const CAP_TOP = -0.734;     // cap top relative to baseline (em)
export const CAP_BOTTOM = 0.163;   // glyph bottom relative to baseline (em)
export const CONDENSE = 0.84;      // real plate lettering is narrower than the font
export const STROKE = 0.022;       // extra weight (em)

const ADVANCE: Record<string, number> = {
  "0": 600, "1": 656, "2": 653, "3": 634, "4": 670, "5": 652, "6": 600, "7": 596, "8": 600, "9": 600,
  " ": 500, "-": 578,
  A: 703, B: 655, C: 673, D: 655, E: 628, F: 630, G: 644, H: 638, I: 493, J: 623, K: 651, L: 673, M: 673,
  N: 684, O: 635, P: 644, Q: 650, R: 596, S: 620, T: 662, U: 628, V: 678, W: 619, X: 658, Y: 627, Z: 669,
};
/** Letters the font lacks, drawn as base letter + dots. */
export const UMLAUT_BASE: Record<string, string> = { "Ä": "A", "Ö": "O", "Ü": "U" };

export function charAdvanceEm(ch: string) {
  return (ADVANCE[UMLAUT_BASE[ch] ?? ch] ?? 640) / 1000;
}
export function textAdvanceEm(s: string) {
  let w = 0;
  for (const ch of s) w += charAdvanceEm(ch);
  return w;
}

/** Normalise stored plate text into how it is printed on the plate. */
export function formatPlateText(country: string, raw: string) {
  const t = String(raw || "").toUpperCase().trim().replace(/\s+/g, " ");
  if (country === "germany" && t.includes("-")) {
    // Stored as "M-AB123" → printed "M AB 123"
    const [district, ...rest] = t.split("-");
    const tail = rest.join("-").replace(/^([A-ZÄÖÜ]+)(\d)/, "$1 $2");
    return `${district} ${tail}`;
  }
  return t;
}

/** Divide plate text into pieces, one per slot. Returns null if the text doesn't fit the rule. */
function splitText(rule: SplitRule, text: string): string[] | null {
  if (rule === "seal") {
    const m = text.match(/^([A-Z]{1,3})\s?(.+)$/);          // "AB 195 IF" → AB | 195 IF
    return m ? [m[1], m[2].trim()] : null;
  }
  if (rule === "al-double") {
    const m = text.replace(/\s+/g, "").match(/^([A-Z]{1,3})(\d{1,4})([A-Z]{1,3})$/); // AB123CD
    return m ? [m[1], m[2], m[3]] : null;
  }
  return null;
}

/** Slots in reading order, each with the row it sits in. */
function slotsOf(art: PlateArt) {
  return art.rows.flatMap((row) => row.boxes.map((box) => ({ row, box })));
}

export type TextRun = {
  text: string;
  x0: number;          // horizontal slot the run is centred in
  x1: number;
  fontSize: number;
  centerY: number;     // vertical centre of the capitals
};

export type PlateLayout = {
  width: number;
  height: number;
  printed: string;
  art: PlateArt | null;
  runs: TextRun[];
  /** Neutral chip styling when there is no artwork. */
  chip: { border: number; radius: number } | null;
};

export function plateLayout(country: string, rawText: string, height: number, plateType?: string | null): PlateLayout {
  const key = country.toLowerCase();
  const printed = formatPlateText(key, rawText);
  const h = height;
  const art = plateArtFor(key, plateType);
  const capH = CAP_BOTTOM - CAP_TOP; // em

  if (art) {
    const s = h / art.h;
    const width = Math.round(art.w * s);
    const slots = slotsOf(art);

    // Pieces per slot; text that doesn't match the plate's pattern goes in the
    // tallest row, with that row's slots merged into one.
    const pieces = splitText(art.split, printed);
    let parts: { text: string; row: ArtRow; box: Box }[];
    if (pieces && pieces.length === slots.length) {
      parts = slots.map((slot, i) => ({ text: pieces[i], ...slot }));
    } else {
      const row = art.rows.reduce((a, b) => (b.y1 - b.y0 > a.y1 - a.y0 ? b : a));
      parts = [{ text: printed, row, box: { x0: row.boxes[0].x0, x1: row.boxes[row.boxes.length - 1].x1 } }];
    }

    // One font size for the whole plate (real plates use a single letter height),
    // capped by each row's height and small enough for every piece to fit its slot.
    const fontSize = Math.min(
      ...parts.map((p) => ((p.row.y1 - p.row.y0) * s * 0.72) / capH), // capitals fill ~72% of the row
      ...parts.map((p) => ((p.box.x1 - p.box.x0) * s) / (Math.max(textAdvanceEm(p.text), 0.6) * CONDENSE)),
    );

    return {
      width,
      height: h,
      printed,
      art,
      chip: null,
      runs: parts.map((p) => ({
        text: p.text,
        x0: p.box.x0 * s,
        x1: p.box.x1 * s,
        fontSize,
        centerY: ((p.row.y0 + p.row.y1) / 2) * s,
      })),
    };
  }

  // Neutral chip: white plate, dark border, text only
  const border = Math.max(1.5, h * 0.06);
  const fontSize = ((h - border * 2) * 0.74) / capH;
  const padX = h * 0.3;
  const textW = textAdvanceEm(printed) * fontSize * CONDENSE;
  const width = Math.round(textW + padX * 2 + border * 2);
  return {
    width,
    height: h,
    printed,
    art: null,
    chip: { border, radius: h * 0.14 },
    runs: [{ text: printed, x0: border + padX, x1: width - border - padX, fontSize, centerY: h / 2 }],
  };
}
