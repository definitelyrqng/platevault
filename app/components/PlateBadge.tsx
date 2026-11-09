/**
 * PlateBadge — shows a spot's plate number.
 *
 * Countries with real plate artwork in /public/plates/<country>/ get the text
 * laid onto that background, split around the seal where the artwork has one.
 * Every other country gets a neutral plate-font chip (no invented plate design).
 *
 * To add a country: drop its background PNG into /public/plates/<country>/ and
 * add a PLATE_ART entry. Coordinates are in the image's own pixels — measure the
 * white writable area and, if there is one, the seal between the text groups.
 */

type Box = { x0: number; x1: number };

type PlateArt = {
  src: string;
  w: number;            // image width (px)
  h: number;            // image height (px)
  textY0: number;       // writable area top (px)
  textY1: number;       // writable area bottom (px)
  /** One box = text centred in it. Two boxes = text split at the first space (left | seal | right). */
  boxes: [Box] | [Box, Box];
};

const PLATE_ART: Record<string, PlateArt> = {
  // Measured from cars_current_single.png: white area x108–899, y14–205, seal x365–401.
  albania: {
    src: "/plates/albania/cars_current_single.png",
    w: 1000,
    h: 221,
    textY0: 14,
    textY1: 205,
    boxes: [{ x0: 120, x1: 355 }, { x0: 411, x1: 889 }],
  },
};

const HEIGHTS = {
  xs: 20,
  sm: 28,
  md: 38,
  lg: 58,
  xl: 86,
} as const;

export type PlateSize = keyof typeof HEIGHTS;

/* FE-Schrift metrics (measured): caps are 0.89em tall and sit ~3% low in the
   line box; letters ≈0.66em wide, space 0.5em. Real plate lettering is
   narrower than the web font, so it is condensed horizontally. */
const GLYPH_H = 0.89;
const GLYPH_DROP = 0.03;
const CONDENSE = 0.84;

function textWidthEm(s: string) {
  let w = 0;
  for (const ch of s) w += ch === " " ? 0.5 : ch === "I" ? 0.5 : 0.66;
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

/** Split text into [left, right] around the seal: "AB 195 IF" → ["AB", "195 IF"]. */
function splitAtSeal(text: string): [string, string] | null {
  const m = text.match(/^([A-Z]{1,3})\s?(.+)$/);
  return m ? [m[1], m[2].trim()] : null;
}

function PlateText({ text, left, width, fontSize, centerY, color = "#111" }: {
  text: string; left: number; width: number; fontSize: number; centerY: number; color?: string;
}) {
  return (
    <span
      className="font-plate absolute flex items-center justify-center whitespace-nowrap leading-none"
      style={{
        left,
        width,
        top: centerY - fontSize / 2 - fontSize * GLYPH_DROP,
        height: fontSize,
        fontSize,
        color,
        WebkitTextStroke: `${fontSize * 0.022}px ${color}`, // real plate lettering is a touch heavier
      }}
    >
      <span style={{ display: "inline-block", transform: `scaleX(${CONDENSE})` }}>{text}</span>
    </span>
  );
}

export default function PlateBadge({
  country,
  text,
  size = "md",
  className = "",
}: {
  country: string;
  text: string;
  size?: PlateSize;
  className?: string;
}) {
  const key = country.toLowerCase();
  const printed = formatPlateText(key, text);
  const h = HEIGHTS[size];
  const art = PLATE_ART[key];

  if (art) {
    const s = h / art.h;                         // image px → rendered px
    const w = Math.round(art.w * s);
    const areaH = (art.textY1 - art.textY0) * s;
    const centerY = ((art.textY0 + art.textY1) / 2) * s;
    const maxFont = (areaH * 0.72) / GLYPH_H;    // caps fill ~72% of the white area

    const split = art.boxes.length === 2 ? splitAtSeal(printed) : null;
    const parts: { text: string; box: Box }[] = split
      ? [{ text: split[0], box: art.boxes[0] }, { text: split[1], box: art.boxes[1] as Box }]
      : [{ text: printed, box: { x0: art.boxes[0].x0, x1: art.boxes[art.boxes.length - 1].x1 } }];

    // One font size for the whole plate, small enough for every group to fit.
    const fontSize = Math.min(
      maxFont,
      ...parts.map((p) => ((p.box.x1 - p.box.x0) * s) / (Math.max(textWidthEm(p.text), 1) * CONDENSE)),
    );

    return (
      <span
        className={`relative inline-block shrink-0 select-none align-middle ${className}`}
        style={{ width: w, height: h }}
        title={text}
        role="img"
        aria-label={`Plate ${printed}`}
      >
        <img src={art.src} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full" />
        {parts.map((p, i) => (
          <PlateText key={i} text={p.text} left={p.box.x0 * s} width={(p.box.x1 - p.box.x0) * s}
            fontSize={fontSize} centerY={centerY} />
        ))}
      </span>
    );
  }

  // ── Neutral chip for countries without artwork ──
  const fontSize = (h * 0.7) / GLYPH_H;
  const padX = h * 0.32;
  const border = Math.max(1.5, h * 0.06);
  const width = textWidthEm(printed) * fontSize * CONDENSE + padX * 2 + border * 2;
  return (
    <span
      className={`relative inline-block shrink-0 select-none align-middle ${className}`}
      style={{
        width,
        height: h,
        background: "#fbfbf8",
        border: `${border}px solid #161616`,
        borderRadius: h * 0.14,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}
      title={text}
      role="img"
      aria-label={`Plate ${printed}`}
    >
      <PlateText text={printed} left={padX} width={width - padX * 2 - border * 2}
        fontSize={fontSize} centerY={(h - border * 2) / 2} />
    </span>
  );
}
