import Flag from "./Flag";
import { getCountryMeta } from "@/app/lib/countries";

/** Photo-backed country tile — the PlateVault take on PlatesMania's country boxes. */
export default function CountryTile({
  country,
  spots,
  spotters,
  coverUrl,
}: {
  country: string;
  spots: number;
  spotters?: number;
  coverUrl?: string | null;
}) {
  const meta = getCountryMeta(country);
  return (
    <a
      href={`/c/${country}`}
      className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800/80 transition hover:ring-indigo-500/70"
    >
      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-90"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="relative flex items-end justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <div className="mb-1.5 leading-none">
            <span className="inline-block rounded-[3px] ring-1 ring-black/40 shadow leading-none">
              <Flag iso={meta.iso} size="lg" />
            </span>
          </div>
          <div className="truncate text-base font-semibold text-white">{meta.name}</div>
          <div className="text-xs text-white/70 tabular-nums">
            {spots.toLocaleString()} photo{spots === 1 ? "" : "s"}
            {spotters != null && <> · {spotters} spotter{spotters === 1 ? "" : "s"}</>}
          </div>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition group-hover:bg-indigo-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
        </span>
      </div>
    </a>
  );
}
