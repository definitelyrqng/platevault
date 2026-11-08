/**
 * PlateBadge — shows a spot's plate number.
 *
 * Countries with real plate artwork in /public/plates/<country>/ get the text
 * laid onto that background. Every other country gets a neutral plate-font chip
 * (no invented plate design). To add a country: drop its background PNG into
 * /public/plates/<country>/ and add an entry to PLATE_ART below.
 */

type PlateArt = {
  src: string;
  ratio: number;      // width / height of the image
  textLeft: number;   // where the writable area starts (fraction of width)
  textRight: number;  // where it ends (fraction of width)
};

const PLATE_ART: Record<string, PlateArt> = {
  albania: { src: "/plates/albania/cars_current_single.png", ratio: 1000 / 221, textLeft: 0.11, textRight: 0.895 },
};

const HEIGHTS = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 52,
  xl: 76,
} as const;

export type PlateSize = keyof typeof HEIGHTS;

/** Normalise stored plate text into how it is printed on the plate. */
export function formatPlateText(country: string, raw: string) {
  const t = String(raw || "").toUpperCase().trim();
  if (country === "germany" && t.includes("-")) {
    // Stored as "M-AB123" → printed "M AB 123"
    const [district, ...rest] = t.split("-");
    const tail = rest.join("-").replace(/^([A-ZÄÖÜ]+)(\d)/, "$1 $2");
    return `${district} ${tail}`;
  }
  return t;
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
    const w = Math.round(h * art.ratio);
    const area = w * (art.textRight - art.textLeft);
    // Shrink long plates so they always fit inside the writable area.
    const fontSize = Math.min(h * 0.6, area / (Math.max(printed.length, 4) * 0.6));
    return (
      <span
        className={`relative inline-block max-w-full shrink-0 select-none align-middle ${className}`}
        style={{ width: w, height: h }}
        title={text}
      >
        <img src={art.src} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full" />
        <span
          className="font-plate absolute inset-y-0 flex items-center justify-center whitespace-nowrap leading-none"
          style={{
            left: `${art.textLeft * 100}%`,
            right: `${(1 - art.textRight) * 100}%`,
            fontSize,
            color: "#111",
            paddingTop: h * 0.04,
          }}
        >
          {printed}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`font-plate inline-flex max-w-full shrink-0 select-none items-center overflow-hidden whitespace-nowrap leading-none align-middle ${className}`}
      style={{
        height: h,
        fontSize: h * 0.62,
        padding: `${h * 0.06}px ${h * 0.3}px 0`,
        color: "#111",
        background: "#fbfbf8",
        border: `${Math.max(1, h * 0.06)}px solid #1a1a1a`,
        borderRadius: h * 0.16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}
      title={text}
    >
      {printed}
    </span>
  );
}
