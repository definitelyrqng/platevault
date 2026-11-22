"use client";

import { useMemo, useState } from "react";

export type CompanyCard = {
  numericId: number;
  name: string;
  country: string | null;
  city: string | null;
  vehicles: number;       // distinct vehicles (a plate spotted several times counts once)
  cover: string | null;   // latest photo
  brands: string[];       // top brands
  lastSeen: string | null;
};

type Sort = "vehicles" | "name" | "recent";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function CompanyDirectory({ companies }: { companies: CompanyCard[] }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState<Sort>("vehicles");
  const [onlySpotted, setOnlySpotted] = useState(false);

  const countries = useMemo(
    () => [...new Set(companies.map((c) => c.country).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b)),
    [companies],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = companies.filter((c) => {
      if (country && c.country !== country) return false;
      if (onlySpotted && c.vehicles === 0) return false;
      if (!needle) return true;
      return [c.name, c.city, c.country, ...c.brands].some((v) => v?.toLowerCase().includes(needle));
    });
    return list.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name)
      : sort === "recent" ? (b.lastSeen ?? "").localeCompare(a.lastSeen ?? "") || a.name.localeCompare(b.name)
      : b.vehicles - a.vehicles || a.name.localeCompare(b.name));
  }, [companies, q, country, sort, onlySpotted]);

  const FIELD = "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, city or brand…" className={`${FIELD} min-w-[14rem] flex-1`} />
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={FIELD} aria-label="Country">
          <option value="">All countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={FIELD} aria-label="Sort">
          <option value="vehicles">Most vehicles</option>
          <option value="recent">Recently spotted</option>
          <option value="name">A – Z</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
          <input type="checkbox" checked={onlySpotted} onChange={(e) => setOnlySpotted(e.target.checked)} className="accent-indigo-500" />
          With vehicles
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center text-sm text-zinc-500">No company matches.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <a key={c.numericId} href={"/companies/" + c.numericId}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/40 transition-all hover:-translate-y-0.5 hover:border-indigo-700/60 hover:shadow-xl hover:shadow-indigo-950/40">
              <div className="relative aspect-[16/9] overflow-hidden bg-zinc-950">
                {c.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950/50 to-zinc-950 text-4xl font-black tracking-widest text-indigo-300/30">{initials(c.name)}</div>
                )}
                <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">
                  {c.vehicles} vehicle{c.vehicles !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div>
                  <div className="truncate text-base font-semibold text-zinc-100 transition-colors group-hover:text-indigo-200">{c.name}</div>
                  {(c.city || c.country) && <div className="truncate text-xs text-zinc-500">{[c.city, c.country].filter(Boolean).join(", ")}</div>}
                </div>
                {c.brands.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {c.brands.map((b) => <span key={b} className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[11px] text-zinc-400">{b}</span>)}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
