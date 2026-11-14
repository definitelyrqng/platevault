/**
 * Plate geometry shared by the <PlateBadge> component and the /api/plate image
 * route, so the page reserves exactly the size of the baked PNG.
 *
 * Pure data + math only (no React, no fs) — safe to import anywhere.
 */
import { AL_CAP_HEIGHT, AL_WIDTHS } from "./albaniaFontMetrics";
import { BELGIUM_CATEGORIES, parseBelgiumPlateType } from "./belgiumData";
import { parseBosniaPlateType } from "./bosniaData";
import { parseBulgariaPlateType } from "./bulgariaData";
import { AT_CAP_HEIGHT, AT_WIDTHS } from "./austriaFontMetrics";
import { AT47_CAP_HEIGHT, AT47_WIDTHS } from "./austria1947FontMetrics";
import { BA_CAP_HEIGHT, BA_WIDTHS } from "./bosniaFontMetrics";
import { BG_CAP_HEIGHT, BG_WIDTHS } from "./bulgariaFontMetrics";

/**
 * Lettering per country. "fe" = FE-Schrift (default everywhere);
 * "al" = Albanian plate glyphs traced from assets/fonts/albania-glyphs.png
 * (scripts/build-albania-font.cjs). Only used on plates with real artwork.
 */
export type PlateFont = "fe" | "al" | "at" | "at47" | "ba" | "bg";
const COUNTRY_FONT: Record<string, PlateFont> = { albania: "al", austria: "at" };
export function plateFont(country: string): PlateFont {
  return COUNTRY_FONT[country.toLowerCase()] ?? "fe";
}

/** Albanian glyph spacing, in glyph-sheet pixels. */
export const AL_SIDE_BEARING = 12;
export const AL_SPACE = 70;
/** Austrian glyph spacing (assets/fonts/austria-glyphs.png), in glyph-sheet pixels. */
export const AT_SIDE_BEARING = 12;
export const AT_SPACE = 80;
/** Bulgarian plate lettering (built from real plates by scripts/build-bulgaria-font.cjs), in 4× pixels. */
export const BG_SIDE_BEARING = 28;
export const BG_SPACE = 250;
/** Bosnian plate lettering (assets/fonts/bosnia-glyphs.png), in glyph-sheet pixels. */
export const BA_SIDE_BEARING = 6;
export const BA_SPACE = 36;
/** 1947-system lettering (assets/fonts/austria-1947-glyphs.png). */
export const AT47_SIDE_BEARING = 14;
export const AT47_SPACE = 60;
/** Glyph keys of a run: the state prefix "St" is a single ligature glyph. */
export function glyphKeys47(s: string): string[] {
  const m = s.match(/^ST(?=[ \d])/);
  return m ? ["St", ...s.slice(2)] : [...s];
}

/**
 * One line of writing on the plate (artwork pixels): its writable area and how
 * many text pieces it holds. With `seal`, the line is laid out as
 * "<piece 1> ● <piece 2>" (seal: true) or "● <piece 1>" (seal: "left") — the seal is
 * drawn by the renderer, not baked into the artwork, so every plate comes out
 * centred with equal margins.
 */
export type ArtRow = {
  y0: number; y1: number; x0: number; x1: number; slots: number;
  seal?: boolean | "left" | "right";
  /** Gap beside the seal as a fraction of the row height (default SEAL_GAP) — smaller on narrow rows. */
  gap?: number;
  /** Place the text against the right edge of the row instead of centring it. */
  align?: "right" | "left";
  /** Sized on its own (never shrinks the rest of the plate), e.g. the month in the red box. */
  own?: boolean;
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
export type SplitRule = "bg-moto" | "bg-two" | "bg-year" | "ba-two-eu" | "ba-two" | "be-seal" | "be-two" | "at47-two" | "at-prov" | "at-prov-two" | "at-two" | "at-seal" | "whole" | "seal" | "al-double" | "al-twoline" | "al-moto" | "al-trailer-two";

export type PlateArt = {
  src: string;          // path under /public
  w: number;            // image width (px)
  h: number;            // image height (px)
  rows: ArtRow[];
  split: SplitRule;
  /** Seal image drawn between the first two pieces of a `seal` row. */
  seal?: string;
  /** Fixed-shape seal image (width ÷ height); its height is rowH × sealH. */
  sealAspect?: number;
  /** Upper limit for the spacing fillWidth adds, in em. */
  maxTrack?: number;
  /** Spread the characters so the text fills the whole width of its row (all rows share the tightest spacing). */
  fillWidth?: boolean;
  /** Extra space after every character, in em (default 0). */
  tracking?: number;
  /** Share of the row height the capitals fill (default 0.72). */
  fill?: number;
  /** Austria: draw the coat of arms of the plate's state (by district) instead of a fixed seal. */
  stateSeals?: boolean;
  /** Height of a state coat of arms as a fraction of its row. */
  sealH?: number;
  /** Lettering for this artwork (default: the country's). */
  font?: PlateFont;
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
  // trailer_double.png (486×392, border 8): teal like the single-line trailer; top row between the bands x107–386, y13–196,
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
  // ── Bulgaria: standard plate (euroband, black frame). FE-Schrift for now — the real lettering has its own shapes. ──
  // two rows: letters (region + final letters) above, digits below, both right of the small euroband
  "bulgaria:two-line-euroband": { src: "/plates/bulgaria/standard-two.png", w: 1024, h: 660, rows: [{ y0: 42, y1: 300, x0: 196, x1: 1000, slots: 1 }, { y0: 347, y1: 605, x0: 196, x1: 1000, slots: 1 }], font: "bg", split: "bg-two", fill: 0.92 },
  "bulgaria:two-line-flag": { src: "/plates/bulgaria/flag-two.png", w: 1024, h: 660, rows: [{ y0: 42, y1: 300, x0: 196, x1: 1000, slots: 1 }, { y0: 347, y1: 605, x0: 196, x1: 1000, slots: 1 }], font: "bg", split: "bg-two", fill: 0.92 },
  // motorcycle: small square plate, region + two letters above, four digits below (the digits run under the band)
  "bulgaria:moto-euroband": { src: "/plates/bulgaria/moto-euroband.png", w: 1024, h: 740, rows: [{ y0: 52, y1: 332, x0: 214, x1: 996, slots: 1 }, { y0: 410, y1: 690, x0: 60, x1: 996, slots: 1 }], font: "bg", split: "bg-moto", fill: 0.92 },
  "bulgaria:moto-flag": { src: "/plates/bulgaria/moto-flag.png", w: 1024, h: 740, rows: [{ y0: 52, y1: 332, x0: 214, x1: 996, slots: 1 }, { y0: 410, y1: 690, x0: 60, x1: 996, slots: 1 }], font: "bg", split: "bg-moto", fill: 0.92 },
  // diplomatic: red plate, white lettering, year at the right end under a dash
  "bulgaria:diplomatic": { src: "/plates/bulgaria/diplomatic-single.png", w: 1000, h: 224, rows: [{ y0: 22, y1: 204, x0: 124, x1: 826, slots: 1 }, { y0: 122, y1: 200, x0: 850, x1: 968, slots: 1, own: true }], font: "bg", split: "bg-year", fill: 0.82, textColor: "#f6f6f6" },
  // foreign citizens: blue plate, white lettering, expiry year under the dash
  "bulgaria:foreign": { src: "/plates/bulgaria/foreign-single.png", w: 1000, h: 224, rows: [{ y0: 22, y1: 204, x0: 124, x1: 826, slots: 1 }, { y0: 122, y1: 200, x0: 850, x1: 968, slots: 1, own: true }], font: "bg", split: "bg-year", fill: 0.82, textColor: "#f6f6f6" },
  "bulgaria:single-flag": { src: "/plates/bulgaria/military-single.png", w: 1000, h: 224, rows: [{ y0: 22, y1: 204, x0: 124, x1: 964, slots: 1 }], font: "bg", split: "whole", fill: 0.82 },
  "bulgaria:temporary": { src: "/plates/bulgaria/temporary-single.png", w: 1000, h: 224, rows: [{ y0: 22, y1: 204, x0: 124, x1: 826, slots: 1 }, { y0: 122, y1: 200, x0: 850, x1: 968, slots: 1, own: true }], font: "bg", split: "bg-year", fill: 0.82 },
  "bulgaria:single-euroband": { src: "/plates/bulgaria/standard-single.png", w: 1000, h: 224, rows: [{ y0: 22, y1: 204, x0: 124, x1: 964, slots: 1 }], font: "bg", split: "whole", fill: 0.82 },
  // ── Bosnia: current plates (euroband, BiH). Same artwork for every category; FE-Schrift lettering. ──
  "bosnia:single-euroband": { src: "/plates/bosnia/standard-single.png", w: 1920, h: 458, rows: [{ y0: 66, y1: 384, x0: 252, x1: 1806, slots: 1 }], split: "whole", fill: 0.86, fillWidth: true, maxTrack: 0.12 },
  // diplomatic: blue plate, no euroband, gold lettering, centred
  "bosnia:diplomatic-single": { src: "/plates/bosnia/diplomatic-single.png", w: 1920, h: 458, rows: [{ y0: 66, y1: 384, x0: 130, x1: 1790, slots: 1 }], split: "whole", fill: 0.86, fillWidth: true, maxTrack: 0.12, textColor: "#f39a2f" },
  "bosnia:diplomatic-two": { src: "/plates/bosnia/diplomatic-two.png", w: 1024, h: 578, rows: [{ y0: 36, y1: 286, x0: 70, x1: 954, slots: 1 }, { y0: 293, y1: 543, x0: 70, x1: 954, slots: 1 }], split: "ba-two", fill: 0.84, fillWidth: true, maxTrack: 0.07, textColor: "#f39a2f" },
  "bosnia:two-line-euroband": { src: "/plates/bosnia/standard-two.png", w: 1024, h: 578, rows: [{ y0: 36, y1: 286, x0: 190, x1: 984, slots: 1 }, { y0: 293, y1: 543, x0: 56, x1: 968, slots: 1 }], split: "ba-two-eu", fill: 0.84, fillWidth: true, maxTrack: 0.07 },
  // ── Bosnia: standard no-euroband plates (white, black frame). Black lettering in the Bosnian font. ──
  "bosnia:single-no-euroband": { src: "/plates/bosnia/y1998-single.png", w: 1024, h: 196, rows: [{ y0: 10, y1: 186, x0: 72, x1: 952, slots: 1 }], split: "whole", font: "ba", fill: 0.88, fillWidth: true },
  "bosnia:two-line-no-euroband": { src: "/plates/bosnia/y1998-two.png", w: 1024, h: 620, rows: [{ y0: 40, y1: 318, x0: 80, x1: 944, slots: 1, align: "left" }, { y0: 302, y1: 580, x0: 80, x1: 944, slots: 1, align: "left" }], split: "ba-two", font: "ba", fill: 0.8, fillWidth: true, maxTrack: 0.08 },
  // ── Belgium: red plates. Euroband at the left; single row has the emblem / dash / DIV stamp as one seal between the first character and the rest ──
  "belgium:single-dash": { src: "/plates/belgium/regular-single.png", w: 1266, h: 261, rows: [{ y0: 31, y1: 229, x0: 143, x1: 1245, slots: 2, seal: true, gap: 0.12 }], split: "be-seal", seal: "/plates/belgium/seal.png", sealAspect: 60 / 184, sealH: 0.93, textColor: "#a3252b", tracking: 0.13, fill: 0.72 },
  "belgium:single-no-dash": { src: "/plates/belgium/regular-single.png", w: 1266, h: 261, rows: [{ y0: 31, y1: 229, x0: 143, x1: 1245, slots: 1 }], split: "whole", textColor: "#a3252b", tracking: 0.13, fill: 0.72 },
  "belgium:two-line": { src: "/plates/belgium/regular-two.png", w: 1000, h: 600, rows: [{ y0: 36, y1: 300, x0: 190, x1: 830, slots: 1 }, { y0: 304, y1: 568, x0: 190, x1: 830, slots: 1, align: "right" }], split: "be-two", textColor: "#a3252b", tracking: 0.07, fill: 0.64 },
  "belgium:two-line-us": { src: "/plates/belgium/regular-two.png", w: 1000, h: 600, rows: [{ y0: 36, y1: 300, x0: 190, x1: 830, slots: 1 }, { y0: 304, y1: 568, x0: 190, x1: 830, slots: 1, align: "right" }], split: "be-two", textColor: "#a3252b", tracking: 0.07, fill: 0.64 },
  "belgium:agricultural": { src: "/plates/belgium/agricultural-single.png", w: 1266, h: 261, rows: [{ y0: 31, y1: 229, x0: 143, x1: 1245, slots: 1 }], split: "whole", textColor: "#f4f4f4", tracking: 0.12, fill: 0.7 },
  // ── Belgium: military plates (digits only) — flag strip at x218–278, lettering to its right ──
  "belgium:military-single": { src: "/plates/belgium/military-single.png", w: 1040, h: 241, rows: [{ y0: 30, y1: 210, x0: 300, x1: 950, slots: 1 }], split: "whole" },
  // ── Austria: backgrounds in public/plates/austria; one row per line of lettering ──
  "austria:regular-single": { src: "/plates/austria/regular-single.png", w: 1040, h: 220, rows: [{ y0: 26, y1: 194, x0: 128, x1: 1015, slots: 2, seal: true, gap: 0.22 }], split: "at-seal", stateSeals: true, sealH: 0.78 },
  "austria:regular-single-noeuro": { src: "/plates/austria/regular-single-noeuro.png", w: 1040, h: 220, rows: [{ y0: 26, y1: 194, x0: 40, x1: 1000, slots: 2, seal: true, gap: 0.22 }], split: "at-seal", stateSeals: true, sealH: 0.78 },
  "austria:repeater-single": { src: "/plates/austria/repeater-single.png", w: 1040, h: 220, rows: [{ y0: 26, y1: 194, x0: 128, x1: 1005, slots: 2, seal: true, gap: 0.22 }], split: "at-seal", stateSeals: true, sealH: 0.78, textColor: "#fff" },
  "austria:provisional-single": { src: "/plates/austria/provisional-single.png", w: 1040, h: 220, rows: [{ y0: 26, y1: 194, x0: 60, x1: 880, slots: 2, seal: true, gap: 0.22 }, { y0: 26, y1: 194, x0: 922, x1: 1018, slots: 1, own: true }], split: "at-prov", stateSeals: true, sealH: 0.78, textColor: "#fff" },
  "austria:provisional-single-small": { src: "/plates/austria/provisional-single-small.png", w: 1040, h: 220, rows: [{ y0: 26, y1: 194, x0: 60, x1: 880, slots: 2, seal: true, gap: 0.22 }, { y0: 26, y1: 194, x0: 922, x1: 1018, slots: 1, own: true }], split: "at-prov", stateSeals: true, sealH: 0.78, textColor: "#fff" },
  "austria:dealer-single": { src: "/plates/austria/dealer-single.png", w: 1040, h: 240, rows: [{ y0: 30, y1: 208, x0: 60, x1: 985, slots: 2, seal: true, gap: 0.22 }], split: "at-seal", stateSeals: true, sealH: 0.78, textColor: "#fff" },
  "austria:export-single": { src: "/plates/austria/export-single.png", w: 1040, h: 240, rows: [{ y0: 30, y1: 208, x0: 50, x1: 880, slots: 1 }], split: "whole", textColor: "#fff" },
  // diplomatic: the euroband plate, single text run ("WD-56"), no coat of arms
  "austria:diplomatic": { src: "/plates/austria/regular-single.png", w: 1040, h: 220, rows: [{ y0: 26, y1: 194, x0: 128, x1: 1015, slots: 1 }], split: "whole" },
  // 1947 year system: black plates with white lettering (state prefix + 6 digits, "K 146.804")
  "austria:1947-single": { src: "/plates/austria/y1947-single.png", w: 720, h: 280, rows: [{ y0: 42, y1: 238, x0: 44, x1: 676, slots: 1 }], split: "whole", font: "at47", textColor: "#fff" },
  "austria:1947-two": { src: "/plates/austria/y1947-two.png", w: 500, h: 480, rows: [{ y0: 44, y1: 228, x0: 44, x1: 456, slots: 1 }, { y0: 252, y1: 436, x0: 44, x1: 456, slots: 1 }], split: "at47-two", font: "at47", textColor: "#fff" },
  "austria:regular-two": { src: "/plates/austria/regular-two.png", w: 500, h: 400, rows: [{ y0: 24, y1: 195, x0: 120, x1: 480, slots: 1, seal: "right", gap: 0.2 }, { y0: 200, y1: 376, x0: 30, x1: 470, slots: 1 }], split: "at-two", stateSeals: true, sealH: 0.78 },
  "austria:regular-two-noeuro": { src: "/plates/austria/regular-two-noeuro.png", w: 540, h: 400, rows: [{ y0: 24, y1: 195, x0: 30, x1: 510, slots: 1, seal: "right", gap: 0.2 }, { y0: 200, y1: 376, x0: 30, x1: 510, slots: 1 }], split: "at-two", stateSeals: true, sealH: 0.78 },
  "austria:provisional-two": { src: "/plates/austria/provisional-two.png", w: 540, h: 400, rows: [{ y0: 28, y1: 195, x0: 40, x1: 500, slots: 1, seal: "right", gap: 0.2 }, { y0: 202, y1: 376, x0: 40, x1: 395, slots: 1 }, { y0: 202, y1: 376, x0: 421, x1: 502, slots: 1, own: true }], split: "at-prov-two", stateSeals: true, sealH: 0.78, textColor: "#fff" },
  "austria:dealer-two": { src: "/plates/austria/dealer-two.png", w: 540, h: 400, rows: [{ y0: 28, y1: 195, x0: 40, x1: 500, slots: 1, seal: "right", gap: 0.2 }, { y0: 202, y1: 376, x0: 40, x1: 500, slots: 1 }], split: "at-two", stateSeals: true, sealH: 0.78, textColor: "#fff" },
  "austria:export-two": { src: "/plates/austria/export-two.png", w: 540, h: 400, rows: [{ y0: 22, y1: 195, x0: 40, x1: 500, slots: 1 }, { y0: 200, y1: 376, x0: 40, x1: 365, slots: 1 }], split: "at-two", textColor: "#fff" },
};

/**
 * Austrian plate types are "at-<category>-<format>" (see austriaData.ts); they share a
 * handful of backgrounds. Returns the PLATE_ART key, or null (mopeds → neutral chip).
 */
function austriaArtKey(plateType?: string | null): string | null {
  const m = (plateType ?? "").match(/^at-(.+?)-(single-euroband|double-euroband|single-no-euroband|double-no-euroband|repeater|moped|moped-green)$/);
  if (!m) return "austria:regular-single";
  const [, cat, fmt] = m;
  if (fmt === "moped" || fmt === "moped-green") return cat === "provisional" ? "austria:provisional-single-small" : "austria:regular-two-noeuro";
  if (fmt === "repeater") return "austria:repeater-single";
  if (cat === "diplomatic") return "austria:diplomatic";
  if (cat === "1947" || cat === "dealer-1947") return fmt.startsWith("double") ? "austria:1947-two" : "austria:1947-single";
  const two = fmt.startsWith("double");
  const euro = !fmt.includes("no-euroband");
  if (cat === "export") return two ? "austria:export-two" : "austria:export-single";
  if (cat === "provisional") return two ? "austria:provisional-two" : "austria:provisional-single";
  if (cat === "dealer" || cat === "dealer-1947") return two ? "austria:dealer-two" : "austria:dealer-single";
  if (two) return euro ? "austria:regular-two" : "austria:regular-two-noeuro";
  return euro ? "austria:regular-single" : "austria:regular-single-noeuro";
}

/** Austrian coats of arms (public/plates/austria/seals): the full panel with the state name, as on the plate. */
const AT_SEAL_ASPECT = 103 / 138;
const DISTRICT_STATE: Record<string, string[]> = {
  vorarlberg: ["B", "BZ", "DO", "FK"],
  wien: ["W"],
  niederoesterreich: ["AM", "BL", "BN", "GD", "GF", "HL", "HO", "KG", "KO", "KR", "KS", "LF", "MD", "ME", "MI", "NK", "P", "PL", "SB", "SW", "TU", "WB", "WN", "WT", "WU", "WY", "ZT"],
  burgenland: ["E", "EU", "GS", "JE", "MA", "ND", "OP", "OW"],
  kaernten: ["FE", "HE", "K", "KL", "SP", "SV", "VI", "VK", "VL", "WO"],
  steiermark: ["BA", "BM", "DL", "FB", "FF", "G", "GB", "GU", "HB", "HF", "JU", "KF", "LB", "LE", "LI", "LN", "MT", "MU", "MZ", "RA", "SO", "VO", "WZ"],
  oberoesterreich: ["BR", "EF", "FR", "GM", "GR", "KI", "L", "LL", "PE", "RI", "RO", "SD", "SE", "SR", "UU", "VB", "WE", "WL"],
  salzburg: ["HA", "JO", "S", "SL", "TA", "ZE"],
  tirol: ["I", "IL", "IM", "KB", "KU", "LA", "LZ", "RE", "SZ"],
  bund: ["BD", "BH", "BP", "FV", "JW", "PT"],
  feuerwehr: ["FW"],
};
/** 1947 year system: the prefix is the state itself. */
const STATE_1947: Record<string, string> = {
  B: "burgenland", G: "steiermark", K: "kaernten", L: "oberoesterreich", N: "niederoesterreich", O: "oberoesterreich",
  S: "salzburg", ST: "steiermark", T: "tirol", V: "vorarlberg", W: "wien",
};
const SEAL_OF_DISTRICT = new Map(Object.entries(DISTRICT_STATE).flatMap(([state, codes]) => codes.map((c) => [c, state] as const)));
function austriaSealFor(district: string, plateType?: string | null): string | null {
  const code = district.toUpperCase();
  const state = /^at-(1947|dealer-1947)-/.test(plateType ?? "") ? STATE_1947[code] : SEAL_OF_DISTRICT.get(code);
  return state ? `/plates/austria/seals/${state}.png` : null;
}
const sealAspect = (_src: string) => AT_SEAL_ASPECT;

/** Artwork for a plate: its exact type first, then the country default. */
export function plateArtFor(country: string, plateType?: string | null): PlateArt | null {
  const key = country.toLowerCase();
  if (key === "austria") {
    const k = austriaArtKey(plateType);
    const art = k ? PLATE_ART[k] ?? null : null;
    // electric vehicles and green-lettered mopeds: same plate, green characters
    const green = /^at-electric/.test(plateType ?? "") || /moped-green$/.test(plateType ?? "");
    return art && green && !art.textColor ? { ...art, textColor: "#0b7a3b" } : art;
  }
  if (key === "bulgaria") {
    const { category, format } = parseBulgariaPlateType(plateType);
    if (category === "temporary") return PLATE_ART["bulgaria:temporary"] ?? null;
    if (category === "diplomatic") return PLATE_ART["bulgaria:diplomatic"] ?? null;
    if (category === "foreign") return PLATE_ART["bulgaria:foreign"] ?? null;
    if (category === "motorcycle") return PLATE_ART[format.includes("flag") ? "bulgaria:moto-flag" : "bulgaria:moto-euroband"] ?? null;
    if (category === "military" && format.startsWith("two")) return PLATE_ART["bulgaria:two-line-flag"] ?? null;
    if (category === "military" || format === "single-flag") return PLATE_ART["bulgaria:single-flag"] ?? null;
    if (format === "two-line") return PLATE_ART["bulgaria:two-line-euroband"] ?? null;     // older spots
    return PLATE_ART[`bulgaria:${format}`] ?? null;
  }
  if (key === "bosnia") {
    const { category, format } = parseBosniaPlateType(plateType);
    if (category === "diplomatic") return PLATE_ART[format.startsWith("two") ? "bosnia:diplomatic-two" : "bosnia:diplomatic-single"] ?? null;
    const art = PLATE_ART[`bosnia:${format}`] ?? null;
    if (!art || !art.src.includes("standard-")) return art;
    // testing (TT) and portable (MT) plates: red frame and lettering; agricultural plates: green
    if (category === "provisional") return { ...art, src: art.src.replace(".png", "-red.png"), textColor: "#d9231c" };
    if (category === "agricultural") return { ...art, src: art.src.replace(".png", "-green.png"), textColor: "#267d32" };
    return art;
  }
  if (key === "belgium") {
    const { category, format } = parseBelgiumPlateType(plateType);
    // oldtimers have no emblem / DIV stamp; agricultural plates are dark red with white lettering
    const key2 = category === "agricultural" ? "agricultural" : category === "oldtimer" && format === "single-dash" ? "single-no-dash" : format;
    const art = PLATE_ART[`belgium:${key2}`] ?? null;
    // dealer, testing and professional plates have green lettering
    const green = category && BELGIUM_CATEGORIES.find((c) => c.id === category)?.color === "green";
    return art && green
      ? { ...art, src: art.src.replace(".png", "-green.png"), seal: art.seal?.replace("seal.png", "seal-green.png"), textColor: "#1d7a3c" }
      : art;
  }
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

const AT_PX_TO_EM = (CAP_BOTTOM - CAP_TOP) / AT_CAP_HEIGHT;

/** Rendered width of a text run in em, for the given lettering (condensing included). */
export function textWidthEm(s: string, font: PlateFont) {
  if (font === "bg") {
    let px = 0;
    for (const ch of s) px += ch in BG_WIDTHS ? BG_WIDTHS[ch] + 2 * BG_SIDE_BEARING : BG_SPACE;
    return px * ((CAP_BOTTOM - CAP_TOP) / BG_CAP_HEIGHT);
  }
  if (font === "ba") {
    let px = 0;
    for (const ch of s) px += ch in BA_WIDTHS ? BA_WIDTHS[ch] + 2 * BA_SIDE_BEARING : BA_SPACE;
    return px * ((CAP_BOTTOM - CAP_TOP) / BA_CAP_HEIGHT);
  }
  if (font === "at47") {
    let px = 0;
    for (const k of glyphKeys47(s)) px += k in AT47_WIDTHS ? AT47_WIDTHS[k] + 2 * AT47_SIDE_BEARING : AT47_SPACE;
    return px * ((CAP_BOTTOM - CAP_TOP) / AT47_CAP_HEIGHT);
  }
  if (font === "at") {
    let px = 0;
    for (const ch of s) px += ch in AT_WIDTHS ? AT_WIDTHS[ch] + 2 * AT_SIDE_BEARING : AT_SPACE;
    return px * AT_PX_TO_EM;
  }
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
  if (rule === "be-seal" || rule === "be-two") {                                         // Belgian: 1-ABC-123 → 1 | ABC-123   (two rows: 1-ABC | 123)
    const t = text.trim().toUpperCase();
    const m = t.match(/^(\d)-?([A-Z]{3})-?(\d{3})$/);
    if (m) return rule === "be-seal" ? [m[1], `${m[2]}-${m[3]}`] : [`${m[1]}-${m[2]}`, m[3]];
    const g = t.match(/^([A-Z0-9])-(.+)$/);                                               // O-ABC-123, T-AAA, Z-AAA …
    if (!g) return null;
    if (rule === "be-seal") return [g[1], g[2]];
    const parts = g[2].match(/^([A-Z]+)-?(\d+)$/);
    return parts ? [`${g[1]}-${parts[1]}`, parts[2]] : null;
  }
  if (rule === "bg-moto") {                                                             // C 9669 EP → "C EP" | 9669  (motorcycle: three letters, a gap after the region)
    const t = text.trim().split(" ");
    if (t.length !== 3) return null;
    return [`${t[0]} ${t[2]}`, t[1]];
  }
  if (rule === "bg-two") {                                                              // CA 1936 CT → CACT | 1936  (letters above, digits below)
    const t = text.trim().split(" ");
    if (t.length === 2) return [t[0], t[1]];                       // vanity: region above, the custom text below
    if (t.length !== 3) return null;
    return [t[0] + t[2], t[1]];
  }
  if (rule === "bg-year") {                                                             // 201 M 091 19 → 201 M 091 | 19  (year in the red block)
    const t = text.trim().split(" ");
    if (t.length < 2 || !/^[0-9]{2}$/.test(t[t.length - 1])) return null;
    return [t.slice(0, -1).join(" "), t[t.length - 1]];
  }
  if (rule === "ba-two-eu") {                                                           // K98-M-599 → K98 | -M-599
    const m = text.trim().match(/^([^-]+)(-.+)$/);
    return m ? [m[1], m[2]] : null;
  }
  if (rule === "ba-two") {
    const m = text.trim().match(/^([^-]+)-([^-]+)-([^-]+)$/);                              // 743-M-844 → 743-M | -844
    return m ? [`${m[1]}-${m[2]}`, `-${m[3]}`] : null;
  }
  if (rule === "at47-two") {                                                           // "K 146.804" → K 146 | 804
    const m = text.trim().match(/^(\S+)\s+(\d{1,3})\.?(\d{1,3})$/);
    return m ? [`${m[1]} ${m[2]}`, m[3]] : null;
  }
  if (rule === "at-prov" || rule === "at-prov-two") {                                   // "W 12345 A 12" → W 12345 A | 12  (month in the red box)
    const t = text.trim().split(" ");
    if (t.length < 3 || !/^\d{1,2}$/.test(t[t.length - 1])) return null;
    const month = t.pop()!;
    if (rule === "at-prov") return t.length >= 2 ? [t[0], t.slice(1).join(" "), month] : null;
    return t.length >= 2 ? [t[0], t.slice(1).join(" "), month] : null;
  }
  if (rule === "at-two" || rule === "at-seal") {
    const m = text.trim().match(/^(\S+)\s+(.+)$/);                                      // "W 12345 A" → W | 12345 A
    return m ? [m[1], m[2]] : null;
  }
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
  tracking?: number;   // extra space after each character, em
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
  seals: { cx: number; cy: number; d: number; h?: number; src?: string }[];
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
    const font = art.font ?? plateFont(key);
    const stateSrc = art.stateSeals ? austriaSealFor(printed.split(" ")[0], plateType) : null;
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
      const hasSeal = (art.seal || stateSrc) && row.seal;
      const mode: "between" | "left" | "right" | null = !hasSeal ? null
        : row.seal === "left" ? (texts.length >= 1 ? "left" : null)
        : row.seal === "right" ? (texts.length >= 1 ? "right" : null)
        : (texts.length === 2 ? "between" : null);
      const sealH = mode && (stateSrc || art.sealAspect) ? rowH * (art.sealH ?? 0.8) : 0;
      const sealD = !mode ? 0 : stateSrc ? sealH * sealAspect(stateSrc) : art.sealAspect ? sealH * art.sealAspect : rowH * SEAL_DIAMETER;
      const gap = mode ? rowH * (row.gap ?? SEAL_GAP) : 0;
      const gaps = mode === "between" ? 2 : mode === "left" || mode === "right" ? 1 : 0;   // gaps touching the seal
      const ems = texts.map((t) => textWidthEm(t, font) + (art.tracking ?? 0) * [...t].length);
      return { row, texts, rowH, mode, sealD, sealH, gap, gaps, ems, avail: (row.x1 - row.x0) * s };
    });
    const fit = (l: (typeof lines)[number]) => Math.min((l.rowH * (art.fill ?? 0.72)) / capH, (l.avail - l.sealD - l.gaps * l.gap) / Math.max(l.ems.reduce((x, y) => x + y, 0), 0.5));

    // One letter height for the whole plate: capped by every row's height and by
    // every row's width (text + seal must fit between the bands).
    const shared = lines.filter((l) => !l.row.own);
    const fontSize = Math.min(...(shared.length ? shared : lines).map(fit));   // capitals fill ~72% of the row

    // fillWidth: stretch the letter spacing until the widest line spans its whole row
    let fillTrack = 0;
    if (art.fillWidth) {
      const ts = lines.filter((l) => !l.mode && l.texts.length === 1 && [...l.texts[0]].length > 1)
        .map((l) => (l.avail - l.ems[0] * fontSize) / (([...l.texts[0]].length - 1) * fontSize));
      if (ts.length) fillTrack = Math.max(0, Math.min(art.maxTrack ?? Infinity, ...ts));
    }

    const runs: TextRun[] = [];
    const seals: { cx: number; cy: number; d: number; h?: number; src?: string }[] = [];
    for (const l of lines) {
      const fs = l.row.own ? Math.min(fontSize, fit(l)) : fontSize;
      const widths = l.ems.map((em, i) => em * fs + (fillTrack ? fillTrack * fs * ([...l.texts[i]].length - 1) : 0));
      const total = widths.reduce((x, y) => x + y, 0) + l.sealD + l.gaps * l.gap;
      let x = l.row.align === "right" ? l.row.x1 * s - total : l.row.align === "left" ? l.row.x0 * s : l.row.x0 * s + (l.avail - total) / 2;               // centred → equal margins
      const centerY = ((l.row.y0 + l.row.y1) / 2) * s;
      if (l.mode === "left") {                                    // ● then the text
        seals.push({ cx: x + l.sealD / 2, cy: centerY, d: l.sealD, h: l.sealH || undefined, src: stateSrc ?? undefined });
        x += l.sealD + l.gap;
      }
      l.texts.forEach((text, i) => {
        // Belgian lettering has no slashed zero: use the plain O
        runs.push({ text: key === "belgium" ? text.replace(/0/g, "O") : text, x0: x, x1: x + widths[i], align: "left", fontSize: fs, centerY, tracking: (art.tracking ?? 0) + fillTrack });
        x += widths[i];
        if (l.mode === "right" && i === l.texts.length - 1) {                 // text then ●
          seals.push({ cx: x + l.gap + l.sealD / 2, cy: centerY, d: l.sealD, h: l.sealH || undefined, src: stateSrc ?? undefined });
        }
        if (l.mode === "between" && i === 0) {                    // piece ● piece
          seals.push({ cx: x + l.gap + l.sealD / 2, cy: centerY, d: l.sealD, h: l.sealH || undefined, src: stateSrc ?? undefined });
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
