export default function Flag({ iso }: { iso: string | null }) {
  if (!iso) return null;
  return (
    <img
      src={"https://flagcdn.com/24x18/" + iso + ".png"}
      alt={iso.toUpperCase()}
      width={24}
      height={18}
      className="inline-block align-middle rounded-sm"
    />
  );
}
