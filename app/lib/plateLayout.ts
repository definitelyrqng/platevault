/**
 * Plate geometry shared by the <PlateBadge> component and the /api/plate image
 * route, so the page reserves exactly the size of the baked PNG.
 *
 * Pure data + math only (no React, no fs) — safe to import anywhere.
 */
import { AL_CAP_HEIGHT, AL_WIDTHS } from "./albaniaFontMetrics";

/** A slot text is placed in. `align` pins the text to one side (e.g. tight against the seal). */
export type Box = { x0: number; x1: number; align?: "left" | "center" | "right" };

/**
 * Lettering per country. "fe" = FE-Schrift (default everywhere);
 * "al" = Albanian plate glyphs traced from assets/fonts/albania-glyphs.png
 * (scripts/build-albania-font.cjs). Only used on plates with real artwork.
 */
export type PlateFont = "fe" | "al";
const COUNTRY_FONT: Record<string, PlateFont> = { albania: "al" };
export function plateFont(country: string): PlateFont {
  return COUNTRY_FONT[country.toLowerCase()] ?? "fe";
}

/** Albanian glyph spacing, in glyph-sheet pixels. */
export const AL_SIDE_BEARING = 12;
export const AL_SPACE = 100;

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
  /** Lettering colour (default near-black). */
  textColor?: string;
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
    rows: [{ y0: 14, y1: 205, boxes: [{ x0: 128, x1: 352, align: "right" }, { x0: 414, x1: 876, align: "left" }] }],
    split: "seal",
  },

  // Plates below were prepared with scripts/plate-art.cjs (border 14px / radius 27px,
  // content offset +31,+23) so they all match the car plate's border.

  // trailer_single.png (1602×358): teal area x179–1422, y23–334, seal x585–637. White lettering.
  "albania:trailer-2011-single": {
    src: "/plates/albania/trailer_single.png",
    w: 1602,
    h: 358,
    rows: [{ y0: 23, y1: 334, boxes: [{ x0: 205, x1: 564, align: "right" }, { x0: 658, x1: 1400, align: "left" }] }],
    split: "seal",
    textColor: "#fff",
  },
  // cars_double.png (940×474): top row between the bands x178–761, y23–241 with the seal
  // at x391–454; bottom row full width y242–450.  "AB 123 CD" → AB · 123 / CD
  "albania:car-2011-double": {
    src: "/plates/albania/cars_double.png",
    w: 940,
    h: 474,
    rows: [
      { y0: 23, y1: 241, boxes: [{ x0: 196, x1: 369, align: "right" }, { x0: 476, x1: 744, align: "left" }] },
      { y0: 242, y1: 450, boxes: [{ x0: 70, x1: 870 }] },
    ],
    split: "al-double",
  },
  // cars_old.png (1602×358): pre-2011 plate, red band; white area x179–1570, y23–334. No seal.
  "albania:car-1993-single": {
    src: "/plates/albania/cars_old.png",
    w: 1602,
    h: 358,
    rows: [{ y0: 23, y1: 334, boxes: [{ x0: 205, x1: 1545 }] }],
    split: "whole",
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

/** Albanian glyphs: sheet px → em, scaled so capitals match FE-Schrift's cap height. */
const AL_PX_TO_EM = (CAP_BOTTOM - CAP_TOP) / AL_CAP_HEIGHT;

/** Rendered width of a text run in em, for the given lettering (condensing included). */
export function textWidthEm(s: string, font: PlateFont) {
  if (font === "al") {
    let px = 0;
    for (const ch of s) px += ch in AL_WIDTHS ? AL_WIDTHS[ch] + 2 * AL_SIDE_BEARING : AL_SPACE;
    return px * AL_PX_TO_EM;
  }
  return textAdvanceEm(s) * CONDENSE;
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
  x0: number;          // horizontal slot the run is placed in
  x1: number;
  align: "left" | "center" | "right";
  fontSize: number;
  centerY: number;     // vertical centre of the capitals
};

/** Left edge of a run of the given width inside its slot. */
export function runStartX(run: Pick<TextRun, "x0" | "x1" | "align">, width: number) {
  if (run.align === "left") return run.x0;
  if (run.align === "right") return run.x1 - width;
  return run.x0 + (run.x1 - run.x0 - width) / 2;
}

export type PlateLayout = {
  width: number;
  height: number;
  printed: string;
  art: PlateArt | null;
  /** Lettering used for the runs ("fe" on plain chips). */
  font: PlateFont;
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
    const font = plateFont(key);
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
      ...parts.map((p) => ((p.box.x1 - p.box.x0) * s) / Math.max(textWidthEm(p.text, font), 0.5)),
    );

    return {
      width,
      height: h,
      printed,
      art,
      font,
      chip: null,
      runs: parts.map((p) => ({
        text: p.text,
        x0: p.box.x0 * s,
        x1: p.box.x1 * s,
        align: p.box.align ?? "center",
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
    font: "fe",
    chip: { border, radius: h * 0.14 },
    runs: [{ text: printed, x0: border + padX, x1: width - border - padX, align: "center", fontSize, centerY: h / 2 }],
  };
}
