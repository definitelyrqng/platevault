type AlbaniaCar2011Variant =
  | "single-row"
  | "double-row"
  | "double-row-small"
  | "us-size-double"
  | "us-size-single";

type AlbaniaTrailerVariant = "single-row" | "double-row";
type AlbaniaCar1993Variant = "single-row" | "double-row";

export type PlateRenderProps =
  | {
      country: "albania";
      format: "cars-2011";
      leftAA: string;   // e.g. "AA"
      mid123: string;   // e.g. "123"
      rightAA: string;  // e.g. "AB"
      variant: AlbaniaCar2011Variant;
      className?: string;
    }
  | {
      country: "albania";
      format: "motorcycles-2011";
      leftAA: string;   // e.g. "AA"
      num: string;      // e.g. "1234"
      className?: string;
    }
  | {
      country: "albania";
      format: "trailers-2011";
      leftAA: string;   // e.g. "TR"
      num: string;      // e.g. "1234"
      variant: AlbaniaTrailerVariant;
      className?: string;
    }
  | {
      country: "albania";
      format: "cars-1993";
      region: string;   // e.g. "BC"
      num: string;      // e.g. "1234"
      rightAA: string;  // e.g. "AA"
      variant: AlbaniaCar1993Variant;
      className?: string;
    }
  | {
      // fallback for other countries later
      country: string;
      plateText: string;
      className?: string;
    };

function up(s: string) {
  return String(s || "").toUpperCase().trim();
}
function digitsOnly(s: string) {
  return String(s || "").replace(/\D/g, "");
}
function lettersOnly(s: string) {
  return String(s || "").replace(/[^A-Z]/gi, "").toUpperCase();
}

function PlateBase({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
      <defs>
        <linearGradient id="pvPlate" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f7f8fb" />
          <stop offset="1" stopColor="#e9edf6" />
        </linearGradient>
      </defs>

      {/* base */}
      <rect x="8" y="8" width={width - 16} height={height - 16} rx="18" fill="url(#pvPlate)" />
      <rect
        x="8"
        y="8"
        width={width - 16}
        height={height - 16}
        rx="18"
        fill="none"
        stroke="#0f172a"
        strokeOpacity="0.25"
      />

      {/* left EU-ish band (placeholder for now) */}
      <rect x="18" y="18" width="66" height={height - 36} rx="12" fill="#1d4ed8" />
      <text
        x="51"
        y={Math.floor(height / 2) - 6}
        textAnchor="middle"
        fontSize="20"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fill="#ffffff"
        fontWeight="800"
      >
        AL
      </text>
      <circle cx="51" cy={Math.floor(height / 2) + 20} r="10" fill="#ffffff" opacity="0.9" />
      <circle cx="51" cy={Math.floor(height / 2) + 20} r="6" fill="#1d4ed8" opacity="0.9" />

      {children}
    </svg>
  );
}

function MonoText({
  x,
  y,
  size,
  text,
  anchor = "middle",
  weight = 800,
  spacing = 3,
}: {
  x: number;
  y: number;
  size: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  spacing?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fontFamily='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      fill="#0b1220"
      fontWeight={weight}
      letterSpacing={spacing}
    >
      {text}
    </text>
  );
}

/* =========================
   ALBANIA RENDERS
========================= */

function AlbaniaCars2011({
  leftAA,
  mid123,
  rightAA,
  variant,
}: {
  leftAA: string;
  mid123: string;
  rightAA: string;
  variant: AlbaniaCar2011Variant;
}) {
  const L = lettersOnly(leftAA).slice(0, 2);
  const M = digitsOnly(mid123).slice(0, 3);
  const R = lettersOnly(rightAA).slice(0, 2);

  const singleText = `${L} ${M} ${R}`;

  // sizes
  const isUS = variant.startsWith("us-size");
  const isDouble = variant.startsWith("double-row") || variant.includes("double");
  const W = isUS ? 460 : 520;

  if (!isDouble) {
    // single-row (or us-size-single)
    return (
      <PlateBase width={W} height={120}>
        <MonoText x={Math.floor(W * 0.62)} y={78} size={46} text={singleText} />
      </PlateBase>
    );
  }

  // double-row layouts: split across 2 lines
  const top = `${L} ${M}`;
  const bot = `${R}`;

  const small = variant === "double-row-small";
  const topSize = small ? 34 : 38;
  const botSize = small ? 38 : 42;

  return (
    <PlateBase width={W} height={150}>
      <MonoText x={Math.floor(W * 0.62)} y={74} size={topSize} text={top} />
      <MonoText x={Math.floor(W * 0.62)} y={124} size={botSize} text={bot} />
    </PlateBase>
  );
}

function AlbaniaMotorcycles2011({ leftAA, num }: { leftAA: string; num: string }) {
  const L = lettersOnly(leftAA).slice(0, 2);
  const N = digitsOnly(num).slice(0, 4);
  const text = `${L} ${N}`;

  // motorcycle plate: narrower + taller
  return (
    <PlateBase width={420} height={140}>
      <MonoText x={Math.floor(420 * 0.62)} y={92} size={46} text={text} />
    </PlateBase>
  );
}

function AlbaniaTrailers2011({
  leftAA,
  num,
  variant,
}: {
  leftAA: string;
  num: string;
  variant: AlbaniaTrailerVariant;
}) {
  const L = lettersOnly(leftAA).slice(0, 2);
  const N = digitsOnly(num).slice(0, 4);

  // forced R in the middle
  const singleText = `${L} R ${N}`;

  if (variant === "single-row") {
    return (
      <PlateBase width={520} height={120}>
        <MonoText x={Math.floor(520 * 0.62)} y={78} size={46} text={singleText} />
      </PlateBase>
    );
  }

  // double row: top "L R", bottom "1234"
  return (
    <PlateBase width={520} height={150}>
      <MonoText x={Math.floor(520 * 0.62)} y={74} size={40} text={`${L} R`} />
      <MonoText x={Math.floor(520 * 0.62)} y={124} size={46} text={`${N}`} />
    </PlateBase>
  );
}

function AlbaniaCars1993({
  region,
  num,
  rightAA,
  variant,
}: {
  region: string;
  num: string;
  rightAA: string;
  variant: AlbaniaCar1993Variant;
}) {
  const REG = lettersOnly(region).slice(0, 2);
  const N = digitsOnly(num).slice(0, 4);
  const R = lettersOnly(rightAA).slice(0, 2);

  const singleText = `${REG} ${N} ${R}`;

  if (variant === "single-row") {
    return (
      <PlateBase width={520} height={120}>
        <MonoText x={Math.floor(520 * 0.62)} y={78} size={46} text={singleText} />
      </PlateBase>
    );
  }

  // double-row: top "REG 1234", bottom "AA"
  return (
    <PlateBase width={520} height={150}>
      <MonoText x={Math.floor(520 * 0.62)} y={74} size={40} text={`${REG} ${N}`} />
      <MonoText x={Math.floor(520 * 0.62)} y={124} size={46} text={`${R}`} />
    </PlateBase>
  );
}

/* ========================= */

export default function PlateRender(props: PlateRenderProps) {
  if (props.country === "albania" && "format" in props) {
    const className = props.className;

    if (props.format === "cars-2011") {
      return (
        <div className={className}>
          <AlbaniaCars2011
            leftAA={props.leftAA}
            mid123={props.mid123}
            rightAA={props.rightAA}
            variant={props.variant}
          />
        </div>
      );
    }

    if (props.format === "motorcycles-2011") {
      return (
        <div className={className}>
          <AlbaniaMotorcycles2011 leftAA={props.leftAA} num={props.num} />
        </div>
      );
    }

    if (props.format === "trailers-2011") {
      return (
        <div className={className}>
          <AlbaniaTrailers2011 leftAA={props.leftAA} num={props.num} variant={props.variant} />
        </div>
      );
    }

    if (props.format === "cars-1993") {
      return (
        <div className={className}>
          <AlbaniaCars1993 region={props.region} num={props.num} rightAA={props.rightAA} variant={props.variant} />
        </div>
      );
    }
  }

  // fallback for other countries later
  const t = up(("plateText" in props ? props.plateText : "") || "").slice(0, 16);
  return (
    <div className={props.className}>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300">
        Plate preview not available yet. ({props.country}) {t ? `— ${t}` : ""}
      </div>
    </div>
  );
}
