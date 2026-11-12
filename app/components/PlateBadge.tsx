/**
 * PlateBadge — shows a spot's plate as one baked PNG (plate artwork + lettering),
 * rendered by /api/plate. Because it is a real image, right-click → Copy image /
 * Save image gives the whole plate.
 *
 * Geometry lives in app/lib/plateLayout.ts and is shared with the image route,
 * so the page reserves exactly the image's size (no layout shift).
 */
import { plateLayout, plateArtFor, PLATE_HEIGHTS, type PlateSize } from "@/app/lib/plateLayout";

export { formatPlateText } from "@/app/lib/plateLayout";
export type { PlateSize };

/** Bump when the plate rendering changes, so CDN-cached images refresh. */
const PLATE_IMAGE_VERSION = 24;
/** Render at 3× for crisp output on high-density screens. */
const DENSITY = 3;

export function plateImageUrl(country: string, text: string, height: number, plateType?: string | null) {
  const qs = new URLSearchParams({
    c: country.toLowerCase(),
    t: text,
    h: String(Math.round(height * DENSITY)),
    v: String(PLATE_IMAGE_VERSION),
  });
  // Only plate types with their own artwork change the image — keep other URLs (and caches) stable
  if (plateType && plateArtFor(country, plateType) !== plateArtFor(country)) qs.set("p", plateType);
  return `/api/plate?${qs}`;
}

export default function PlateBadge({
  country,
  text,
  plateType,
  size = "md",
  className = "",
}: {
  country: string;
  text: string;
  /** Picks type-specific artwork (e.g. Albanian trailer plates) when there is one. */
  plateType?: string | null;
  size?: PlateSize;
  className?: string;
}) {
  const h = PLATE_HEIGHTS[size];
  const { width, printed, art } = plateLayout(country, text, h, plateType);

  return (
    <img
      src={plateImageUrl(country, text, h, plateType)}
      width={width}
      height={h}
      alt={printed}
      title={printed}
      loading="lazy"
      decoding="async"
      draggable
      className={`inline-block max-w-full shrink-0 select-none align-middle ${
        art ? "" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
      } ${className}`}
      style={{ aspectRatio: `${width} / ${h}`, height: "auto" }}
    />
  );
}
