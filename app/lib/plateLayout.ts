/**
 * Plate geometry shared by the <PlateBadge> component and the /api/plate image
 * route, so the page reserves exactly the size of the baked PNG.
 *
 * Pure data + math only (no React, no fs) — safe to import anywhere.
 */
import { AL_CAP_HEIGHT, AL_WIDTHS } from "./albaniaFontMetrics";

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
export const AL_SPACE = 70;

/**
 * One line of writing on the plate (artwork pixels): its writable area and how
 * many text pieces it holds. With `seal`, the line is laid out as
 * "<piece 1> ● <piece 2>" (seal: true) or "● <piece 1>" (seal: "left") — the seal is
 * drawn by the renderer, not baked into the artwork, so every plate comes out
 * centred with equal margins.
 */
export type ArtRow = {
  y0: number; y1: number; x0: number; x1: number; slots: number;
  seal?: boolean | "left";
  /** Gap beside the seal as a fraction of the row height (default SEAL_GAP) — smaller on narrow rows. */
  gap?: number;
};

/**
 * How plate text is divided over the pieces (all rows, in order):
 *  - "whole":     everything as one piece
 *  - "seal":      first letter group | rest            ("AB 195 IF" → AB | 195 IF)
 *  - "al-double":  letters | digits | final letters     ("AB 123 CD" → AB | 123 | CD)
 *  - "al-twoline": letters | digits+final letters      ("AB 123 FG" → AB | 123FG)
 *  - "al-moto":    letters | digits                    ("AB 123" → AB | 123)
 *  - "al-trailer-two": letters | "R" + digits          ("AB R 456" → AB | R 456)
 */
export type SplitRule = "whole" | "seal" | "al-double" | "al-twoline" | "al-moto" | "al-trailer-two";

export type PlateArt = {
  src: string;          // path under /public
  w: number;            // image width (px)
  h: number;            // image height (px)
  rows: ArtRow[];
  split: SplitRule;
  /** Seal image drawn between the first two pieces of a `seal` row. */
  seal?: string;
  /** Lettering colour (default near-black). */
  textColor?: string;
};

/** Seal size and the gap either side of it, as fractions of the row height. */
export const SEAL_DIAMETER = 0.194;
export const SEAL_GAP = 0.075;

/**
 * Real plate artwork. Keys are "<country>" (the default for that country) or
 * "<country>:<plateType>" for a specific plate type, e.g. "albania:trailer-2011-single".
 *
 * Artwork must NOT contain the seal (it is placed per plate). Prepare new
 * backgrounds with scripts/plate-art.cjs so borders match, then add an entry
 * with the writable area (x0–x1 already padded away from the bands).
 */
export const PLATE_ART: Record<string, PlateArt> = {
  // cars_current_single.png (1000×221): white area x108–899, y14–205.
  albania: {
    src: "/plates/albania/cars_current_single.png",
    w: 1000,
    h: 221,
    rows: [{ y0: 14, y1: 205, x0: 124, x1: 883, slots: 2, seal: true }],
    split: "seal",
    seal: "/plates/albania/seal.png",
  },
  // trailer_single.png (1602×358, border 14 / radius 27): teal area x179–1422, y23–334. White lettering.
  "albania:trailer-2011-single": {
    src: "/plates/albania/trailer_single.png",
    w: 1602,
    h: 358,
    rows: [{ y0: 23, y1: 334, x0: 205, x1: 1396, slots: 2, seal: true }],
    split: "seal",
    seal: "/plates/albania/seal.png",
    textColor: "#fff",
  },
  // cars_us.png (940×474): US-size plate. Top row between the bands x178–761, y23–241;
  // bottom row full width y242–450.  "AB 123 CD" → AB ● 123 / CD
  "albania:car-2011-us": {
    src: "/plates/albania/cars_us.png",
    w: 940,
    h: 474,
    rows: [
      { y0: 23, y1: 241, x0: 192, x1: 747, slots: 2, seal: true },
      { y0: 242, y1: 450, x0: 60, x1: 880, slots: 1 },
    ],
    split: "al-double",
    seal: "/plates/albania/seal.png",
  },
  // cars_double.png (488×394): the two-line plate. Top row between the bands x108–387, y14–197,
  // seal to the LEFT of the letters; bottom row full width y198–379.  "AB 123 FG" → ● AB / 123FG
  "albania:car-2011-double": {
    src: "/plates/albania/cars_double.png",
    w: 488,
    h: 394,
    rows: [
      { y0: 14, y1: 197, x0: 120, x1: 376, slots: 1, seal: "left" },
      { y0: 198, y1: 379, x0: 36, x1: 452, slots: 1 },
    ],
    split: "al-twoline",
    seal: "/plates/albania/seal.png",
  },
  // trailer_double.png (486×392, border 8): green; top row between the bands x107–386, y13–196,
  // seal left of the letters; bottom row y197–378.  "AB R 456" → ● AB / R 456. White lettering.
  "albania:trailer-2011-double": {
    src: "/plates/albania/trailer_double.png",
    w: 486,
    h: 392,
    rows: [
      { y0: 13, y1: 196, x0: 119, x1: 375, slots: 1, seal: "left" },
      { y0: 197, y1: 378, x0: 35, x1: 451, slots: 1 },
    ],
    split: "al-trailer-two",
    seal: "/plates/albania/seal.png",
    textColor: "#fff",
  },
  // moto.png (408×394, border 8): new square motorcycle plate. Top row between the bands
  // x108–308, y14–197, seal left of the letters (tight — the row is narrow); bottom row y198–379.
  // "AB 123" → ● AB / 123
  "albania:moto-2011": {
    src: "/plates/albania/moto.png",
    w: 408,
    h: 394,
    rows: [
      { y0: 14, y1: 197, x0: 112, x1: 306, slots: 1, seal: "left", gap: 0.04 },
      { y0: 198, y1: 379, x0: 34, x1: 374, slots: 1 },
    ],
    split: "al-moto",
    seal: "/plates/albania/seal.png",
  },
  // cars_old.png (1602×358): pre-2011 plate, red band; white area x179–1570, y23–334. No seal.
  "albania:car-1993-single": {
    src: "/plates/albania/cars_old.png",
    w: 1602,
    h: 358,
    rows: [{ y0: 23, y1: 334, x0: 205, x1: 1545, slots: 1 }],
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
  if (rule === "al-moto") {
    const m = text.replace(/\s+/g, "").match(/^([A-Z]{1,3})(\d{1,4})$/);                 // AB123 → AB | 123
    return m ? [m[1], m[2]] : null;
  }
  if (rule === "al-trailer-two") {
    const m = text.replace(/\s+/g, " ").trim().match(/^([A-Z]{1,3}) ?R ?(\d{1,4})$/);     // AB R 456 → AB | R 456
    return m ? [m[1], `R ${m[2]}`] : null;
  }
  if (rule === "al-twoline") {
    const m = text.replace(/\s+/g, "").match(/^([A-Z]{1,3})(\d{1,4}[A-Z]{1,3})$/);   // AB123FG → AB | 123FG
    return m ? [m[1], m[2]] : null;
  }
  if (rule === "al-double") {
    const m = text.replace(/\s+/g, "").match(/^([A-Z]{1,3})(\d{1,4})([A-Z]{1,3})$/); // AB123CD
    return m ? [m[1], m[2], m[3]] : null;
  }
  return null;
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
  /** Seals to draw (centre + diameter, in output pixels). */
  seals: { cx: number; cy: number; d: number }[];
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

    // Pieces per row. Text that doesn't match the plate's pattern goes, whole,
    // into the tallest row (no seal).
    const pieces = splitText(art.split, printed);
    const totalSlots = art.rows.reduce((n, r) => n + r.slots, 0);
    let rows: { row: ArtRow; texts: string[] }[];
    if (pieces && pieces.length === totalSlots) {
      let i = 0;
      rows = art.rows.map((row) => { const texts = pieces.slice(i, i + row.slots); i += row.slots; return { row, texts }; });
    } else {
      const row = art.rows.reduce((p, q) => (q.y1 - q.y0 > p.y1 - p.y0 ? q : p));
      rows = [{ row, texts: [printed] }];
    }

    const lines = rows.map(({ row, texts }) => {
      const rowH = (row.y1 - row.y0) * s;
      // seal: true → between the first two pieces; seal: "left" → before the first piece
      const mode: "between" | "left" | null = !art.seal || !row.seal ? null
        : row.seal === "left" ? (texts.length >= 1 ? "left" : null)
        : (texts.length === 2 ? "between" : null);
      const sealD = mode ? rowH * SEAL_DIAMETER : 0;
      const gap = mode ? rowH * (row.gap ?? SEAL_GAP) : 0;
      const gaps = mode === "between" ? 2 : mode === "left" ? 1 : 0;   // gaps touching the seal
      const ems = texts.map((t) => textWidthEm(t, font));
      return { row, texts, rowH, mode, sealD, gap, gaps, ems, avail: (row.x1 - row.x0) * s };
    });

    // One letter height for the whole plate: capped by every row's height and by
    // every row's width (text + seal must fit between the bands).
    const fontSize = Math.min(
      ...lines.map((l) => (l.rowH * 0.72) / capH),                 // capitals fill ~72% of the row
      ...lines.map((l) => (l.avail - l.sealD - l.gaps * l.gap) / Math.max(l.ems.reduce((x, y) => x + y, 0), 0.5)),
    );

    const runs: TextRun[] = [];
    const seals: { cx: number; cy: number; d: number }[] = [];
    for (const l of lines) {
      const widths = l.ems.map((em) => em * fontSize);
      const total = widths.reduce((x, y) => x + y, 0) + l.sealD + l.gaps * l.gap;
      let x = l.row.x0 * s + (l.avail - total) / 2;               // centred → equal margins
      const centerY = ((l.row.y0 + l.row.y1) / 2) * s;
      if (l.mode === "left") {                                    // ● then the text
        seals.push({ cx: x + l.sealD / 2, cy: centerY, d: l.sealD });
        x += l.sealD + l.gap;
      }
      l.texts.forEach((text, i) => {
        runs.push({ text, x0: x, x1: x + widths[i], align: "left", fontSize, centerY });
        x += widths[i];
        if (l.mode === "between" && i === 0) {                    // piece ● piece
          seals.push({ cx: x + l.gap + l.sealD / 2, cy: centerY, d: l.sealD });
          x += l.sealD + 2 * l.gap;
        }
      });
    }

    return { width, height: h, printed, art, font, chip: null, runs, seals };
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
    seals: [],
    chip: { border, radius: h * 0.14 },
    runs: [{ text: printed, x0: border + padX, x1: width - border - padX, align: "center", fontSize, centerY: h / 2 }],
  };
}
