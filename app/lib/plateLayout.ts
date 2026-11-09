/**
 * Plate geometry shared by the <PlateBadge> component and the /api/plate image
 * route, so the page reserves exactly the size of the baked PNG.
 *
 * Pure data + math only (no React, no fs) — safe to import anywhere.
 */

export type Box = { x0: number; x1: number };

export type PlateArt = {
  src: string;          // path under /public
  w: number;            // image width (px)
  h: number;            // image height (px)
  textY0: number;       // writable area top (px)
  textY1: number;       // writable area bottom (px)
  /** One box = text centred in it. Two boxes = text split at the first group (left | seal | right). */
  boxes: [Box] | [Box, Box];
};

/**
 * Real plate artwork per country. To add one: drop the PNG into
 * /public/plates/<country>/, measure its white writable area (and seal, if any)
 * in image pixels, and add an entry here.
 */
export const PLATE_ART: Record<string, PlateArt> = {
  // cars_current_single.png: white area x108–899, y14–205, seal x365–401.
  albania: {
    src: "/plates/albania/cars_current_single.png",
    w: 1000,
    h: 221,
    textY0: 14,
    textY1: 205,
    boxes: [{ x0: 120, x1: 355 }, { x0: 411, x1: 889 }],
  },
};

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

/** "AB 195 IF" → ["AB", "195 IF"] for plates with a seal between the groups. */
function splitAtSeal(text: string): [string, string] | null {
  const m = text.match(/^([A-Z]{1,3})\s?(.+)$/);
  return m ? [m[1], m[2].trim()] : null;
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

export function plateLayout(country: string, rawText: string, height: number): PlateLayout {
  const key = country.toLowerCase();
  const printed = formatPlateText(key, rawText);
  const h = height;
  const art = PLATE_ART[key] ?? null;
  const capH = CAP_BOTTOM - CAP_TOP; // em

  if (art) {
    const s = h / art.h;
    const width = Math.round(art.w * s);
    const areaH = (art.textY1 - art.textY0) * s;
    const centerY = ((art.textY0 + art.textY1) / 2) * s;
    const maxFont = (areaH * 0.72) / capH; // capitals fill ~72% of the white area

    const split = art.boxes.length === 2 ? splitAtSeal(printed) : null;
    const parts = split
      ? [{ text: split[0], box: art.boxes[0] }, { text: split[1], box: art.boxes[1] as Box }]
      : [{ text: printed, box: { x0: art.boxes[0].x0, x1: art.boxes[art.boxes.length - 1].x1 } }];

    const fontSize = Math.min(
      maxFont,
      ...parts.map((p) => ((p.box.x1 - p.box.x0) * s) / (Math.max(textAdvanceEm(p.text), 0.6) * CONDENSE)),
    );

    return {
      width,
      height: h,
      printed,
      art,
      chip: null,
      runs: parts.map((p) => ({ text: p.text, x0: p.box.x0 * s, x1: p.box.x1 * s, fontSize, centerY })),
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
