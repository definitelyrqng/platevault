import Image from "next/image";

export default function Flag({ iso, size = 20 }: { iso: string | null; size?: number }) {
  const w = Math.round(size * 1.33);
  if (!iso) return <span className="inline-block rounded-sm bg-zinc-700" style={{ width: w, height: size }} />;
  return (
    <Image
      src={"https://flagcdn.com/" + w + "x" + size + "/" + iso + ".png"}
      alt={iso.toUpperCase()}
      width={w}
      height={size}
      className="inline-block align-middle rounded-sm"
      unoptimized
    />
  );
}
