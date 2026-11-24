"use client";

import { useMemo, useState, type ReactNode } from "react";

export type TypeTile = { key: string; label: string; count: number; active: boolean; href: string; plate: ReactNode };

const COLLAPSED = 8;

/** The plate-type tiles of a country: shows the most-spotted ones, the rest opens on demand and can be searched. */
export default function PlateTypeSection({ tiles, clearHref, anyActive }: { tiles: TypeTile[]; clearHref: string; anyActive: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const spotted = tiles.filter((t) => t.count > 0).length;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle) return tiles.filter((t) => t.label.toLowerCase().includes(needle));
    if (open) return tiles;
    const head = tiles.slice(0, COLLAPSED);
    const picked = tiles.find((t) => t.active && !head.includes(t));      // the chosen type stays visible
    return picked ? [...head.slice(0, COLLAPSED - 1), picked] : head;
  }, [tiles, open, q]);

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Plate types <span className="ml-1 normal-case tracking-normal text-zinc-600">{spotted} spotted · {tiles.length} in total</span>
        </h2>
        {tiles.length > COLLAPSED && (
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a plate type…"
            className="h-8 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 outline-none focus:border-indigo-500 sm:w-56" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((t) => (
          <a key={t.key} href={t.href}
            className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
              t.active ? "border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500/50" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
            }`}>
            <span className="flex h-[68px] w-full items-center justify-center overflow-hidden">{t.plate}</span>
            <span className="text-sm font-medium text-zinc-200">{t.label}</span>
            <span className={`text-xs tabular-nums ${t.count ? "text-zinc-500" : "text-zinc-600"}`}>{t.count ? `${t.count.toLocaleString()} photo${t.count === 1 ? "" : "s"}` : "not spotted yet"}</span>
          </a>
        ))}
        {shown.length === 0 && <p className="col-span-full py-4 text-center text-sm text-zinc-500">No plate type matches “{q}”.</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {!q && tiles.length > COLLAPSED && (
          <button type="button" onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-indigo-500 hover:text-white">
            {open ? "Show fewer plate types ↑" : `Show all ${tiles.length} plate types ↓`}
          </button>
        )}
        {anyActive && <a href={clearHref} className="text-xs text-indigo-300 hover:text-indigo-200">× Show all plate types</a>}
      </div>
    </section>
  );
}
