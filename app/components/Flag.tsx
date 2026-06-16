const SIZES = {
  sm: { w: 16, h: 12, cdn: "16x12" },
  md: { w: 24, h: 18, cdn: "24x18" },
  lg: { w: 32, h: 24, cdn: "32x24" },
} as const;

export default function Flag({
  iso,
  size = "md",
}: {
  iso: string | null;
  size?: keyof typeof SIZES;
}) {
  if (!iso) return null;
  const s = SIZES[size];
  return (
    <img
      src={`https://flagcdn.com/${s.cdn}/${iso}.png`}
      alt={iso.toUpperCase()}
      width={s.w}
      height={s.h}
      className="inline-block align-middle rounded-sm"
    />
  );
}
