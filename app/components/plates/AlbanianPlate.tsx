/**
 * AlbanianPlate
 * Background image: /plates/albania/cars_current_single.png (1000x221)
 * SVG viewBox is locked to 1000x221 so all text coords are in image-space pixels.
 * Pass a different width/height to scale — aspect ratio is preserved automatically.
 *
 * TEXT AREA (measured from the 1000x221 background):
 *   - Blue strip ends at ~140px from left
 *   - Circle starts at ~935px from left
 *   - Text center X: ~537px, center Y: ~110px
 *   - Font size: ~100px  (tweak TEXT_X / TEXT_Y / TEXT_SIZE if needed)
 *
 * To calibrate: set DEBUG=true below, open in browser, adjust constants.
 */

const DEBUG = false; // set true to see crosshair + centre dot

// ── Calibration constants (all in 1000×221 image-space pixels) ──────────────
const TEXT_X    = 537;   // horizontal centre of the text
const TEXT_Y    = 117;   // vertical   centre of the text (baseline sits a bit lower than mid)
const TEXT_SIZE = 102;   // font-size in px
const TEXT_LS   = "6px"; // letter-spacing
// ─────────────────────────────────────────────────────────────────────────────

interface AlbanianPlateProps {
  text: string;
  /** Rendered width in px. Height is derived from the 1000:221 aspect ratio. */
  width?: number;
}

export default function AlbanianPlate({ text, width = 380 }: AlbanianPlateProps) {
  const height = Math.round(width * (221 / 1000));

  return (
    <svg
      viewBox="0 0 1000 221"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={"Albanian plate " + text}
      style={{ display: "block", maxWidth: "100%" }}
    >
      {/* Background plate image */}
      <image
        href="/plates/albania/cars_current_single.png"
        x="0" y="0" width="1000" height="221"
        preserveAspectRatio="none"
      />

      {/* Plate text — FE-Schrift loaded via @font-face in globals.css */}
      <text
        x={TEXT_X}
        y={TEXT_Y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="FE-Schrift, Arial Black, Arial, sans-serif"
        fontWeight="bold"
        fontSize={TEXT_SIZE}
        letterSpacing={TEXT_LS}
        fill="#111111"
      >
        {text}
      </text>

      {DEBUG && (
        <>
          {/* Vertical centre line */}
          <line x1={TEXT_X} y1="0" x2={TEXT_X} y2="221" stroke="red" strokeWidth="1" />
          {/* Horizontal centre line */}
          <line x1="0" y1={TEXT_Y} x2="1000" y2={TEXT_Y} stroke="red" strokeWidth="1" />
          {/* Centre dot */}
          <circle cx={TEXT_X} cy={TEXT_Y} r="4" fill="red" />
          {/* Text area box */}
          <rect x="140" y="10" width="795" height="201" fill="none" stroke="blue" strokeWidth="2" strokeDasharray="8,4" />
        </>
      )}
    </svg>
  );
}
