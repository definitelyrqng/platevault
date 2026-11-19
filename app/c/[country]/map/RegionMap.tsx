"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Area = { n: string; c: string[]; s?: string; k?: string; d: string };
type MapData = { w: number; h: number; areas: Area[] };

const STATES: Record<string, string> = {
  "01": "Schleswig-Holstein", "02": "Hamburg", "03": "Lower Saxony", "04": "Bremen", "05": "North Rhine-Westphalia", "06": "Hesse",
  "07": "Rhineland-Palatinate", "08": "Baden-Württemberg", "09": "Bavaria", "10": "Saarland", "11": "Berlin", "12": "Brandenburg",
  "13": "Mecklenburg-Vorpommern", "14": "Saxony", "15": "Saxony-Anhalt", "16": "Thuringia",
};

/** Empty districts stay dark; the more spots, the brighter (log scale so one busy city does not wash out the rest). */
function colour(count: number, max: number) {
  if (count <= 0) return "#1c1c21";
  const t = Math.min(1, Math.log(1 + count) / Math.log(1 + Math.max(max, 2)));
  const l = 28 + t * 40;                                     // lightness 28% … 68%
  return `hsl(${238 - t * 18} ${55 + t * 25}% ${l}%)`;
}

export default function RegionMap({ country, dataUrl, counts, unit }: { country: string; dataUrl: string; counts: Record<string, number>; unit: { singular: string; plural: string } }) {
  const [data, setData] = useState<MapData | null>(null);
  const [hover, setHover] = useState<{ a: Area; x: number; y: number } | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number; moved: boolean } | null>(null);

  useEffect(() => {
    fetch(dataUrl).then((r) => r.json()).then((d: MapData) => { setData(d); setView({ x: 0, y: 0, w: d.w, h: d.h }); }).catch(() => {});
  }, [dataUrl]);

  const countOf = useMemo(() => (a: Area) => a.c.reduce((n, c) => n + (counts[c] ?? 0), 0), [counts]);
  const max = useMemo(() => (data ? Math.max(0, ...data.areas.map(countOf)) : 0), [data, countOf]);
  const q = query.trim().toLowerCase();
  const matches = (a: Area) => !!q && (a.n.toLowerCase().includes(q) || a.c.some((c) => c.toLowerCase() === q || c.toLowerCase().startsWith(q)));
  // a city and its surrounding district share a name and a plate code (München, Augsburg, …): list them once
  const groups = useMemo(() => {
    const m = new Map<string, { a: Area; names: string[]; n: number }>();
    for (const a of data?.areas ?? []) {
      const n = countOf(a);
      const g = m.get(a.n);
      if (g) { if (n > g.n) { g.n = n; g.a = a; } } else m.set(a.n, { a, names: [a.n], n });
    }
    return [...m.values()];
  }, [data, countOf]);
  const top = useMemo(() => groups.filter((g) => g.n > 0).sort((p, r) => r.n - p.n).slice(0, 12), [groups]);
  const total = useMemo(() => Object.values(counts).reduce((n, c) => n + c, 0), [counts]);
  const covered = useMemo(() => groups.filter((g) => g.n > 0).length, [groups]);

  const hrefOf = (a: Area) => `/c/${country}?region=${encodeURIComponent(a.c.join(","))}`;

  function zoom(factor: number, cx?: number, cy?: number) {
    if (!view || !data) return;
    const nw = Math.min(data.w, Math.max(data.w / 14, view.w * factor)), nh = nw * (view.h / view.w);
    const fx = cx ?? view.x + view.w / 2, fy = cy ?? view.y + view.h / 2;
    const x = fx - ((fx - view.x) / view.w) * nw, y = fy - ((fy - view.y) / view.h) * nh;
    setView({ x: Math.min(Math.max(x, -20), data.w - nw + 20), y: Math.min(Math.max(y, -20), data.h - nh + 20), w: nw, h: nh });
  }
  function toSvg(e: { clientX: number; clientY: number }) {
    const r = wrap.current!.getBoundingClientRect();
    return { x: view!.x + ((e.clientX - r.left) / r.width) * view!.w, y: view!.y + ((e.clientY - r.top) / r.height) * view!.h };
  }

  // wheel zoom needs a non-passive listener to stop the page from scrolling at the same time
  const zoomRef = useRef<(e: WheelEvent) => void>(() => {});
  zoomRef.current = (e) => { const p = toSvg(e); zoom(e.deltaY < 0 ? 0.85 : 1 / 0.85, p.x, p.y); };
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const on = (e: WheelEvent) => { e.preventDefault(); zoomRef.current(e); };
    el.addEventListener("wheel", on, { passive: false });
    return () => el.removeEventListener("wheel", on);
  }, [data]);

  if (!data || !view) return <div className="grid h-[60vh] place-items-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-500">Loading the map…</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
        {/* controls */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a place or code…"
            className="h-9 w-48 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-indigo-500" />
        </div>
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
          <button type="button" aria-label="Zoom in" onClick={() => zoom(0.7)} className="h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-900/90 text-lg text-zinc-200 hover:border-zinc-500">+</button>
          <button type="button" aria-label="Zoom out" onClick={() => zoom(1 / 0.7)} className="h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-900/90 text-lg text-zinc-200 hover:border-zinc-500">−</button>
          <button type="button" aria-label="Reset" onClick={() => setView({ x: 0, y: 0, w: data.w, h: data.h })} className="h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-900/90 text-xs text-zinc-300 hover:border-zinc-500">⤢</button>
        </div>

        <div ref={wrap} className="mx-auto w-full cursor-grab touch-none select-none active:cursor-grabbing" style={{ aspectRatio: `${data.w} / ${data.h}`, maxWidth: `min(100%, calc(78vh * ${data.w / data.h}))` }}
          onPointerDown={(e) => { drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y, moved: false }; }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d && e.buttons) {
              const r = wrap.current!.getBoundingClientRect();
              const dx = ((e.clientX - d.px) / r.width) * view.w, dy = ((e.clientY - d.py) / r.height) * view.h;
              if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 4) d.moved = true;
              if (d.moved) setView({ ...view, x: Math.min(Math.max(d.vx - dx, -20), data.w - view.w + 20), y: Math.min(Math.max(d.vy - dy, -20), data.h - view.h + 20) });
            }
          }}
          onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
          onPointerLeave={() => setHover(null)}>
          <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Map of ${country}`}>
            {data.areas.map((a, i) => {
              const n = countOf(a);
              const hit = matches(a);
              return (
                <path key={i} d={a.d} fill={colour(n, max)} stroke={hit ? "#fbbf24" : "#09090b"} strokeWidth={hit ? 1.6 : 0.45} strokeLinejoin="round"
                  className="cursor-pointer transition-[filter] hover:brightness-150"
                  onPointerMove={(e) => { const r = wrap.current!.getBoundingClientRect(); setHover({ a, x: e.clientX - r.left, y: e.clientY - r.top }); }}
                  onClick={() => { if (!drag.current?.moved) window.location.href = hrefOf(a); }}>
                  <title>{a.n}</title>
                </path>
              );
            })}
          </svg>
        </div>

        {hover && (
          <div className="pointer-events-none absolute z-20 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl"
            style={{ left: Math.min(hover.x + 14, (wrap.current?.clientWidth ?? 600) - 170), top: hover.y + 14 }}>
            <div className="text-sm font-semibold text-white">{hover.a.n}</div>
            <div className="mt-0.5 font-mono text-zinc-400">{hover.a.c.join(" · ")}</div>
            <div className="mt-1 text-zinc-300">{countOf(hover.a) ? <><strong className="text-indigo-300">{countOf(hover.a)}</strong> spot{countOf(hover.a) === 1 ? "" : "s"}</> : "No spots yet"}</div>
            {country === "germany" && hover.a.s && <div className="text-zinc-500">{STATES[hover.a.s]}</div>}
          </div>
        )}

        {/* legend */}
        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-500">
          <span>Click a {unit.singular} to see its plates · scroll to zoom · drag to move</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colour(0, max) }} /> none
            <span className="ml-2 h-2.5 w-16 rounded-sm" style={{ background: `linear-gradient(90deg, ${colour(1, max)}, ${colour(max, max)})` }} /> more
          </span>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Coverage</div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-white">{covered}<span className="text-lg font-medium text-zinc-500"> / {groups.length}</span></div>
          <div className="text-sm text-zinc-400">{unit.plural} spotted · {total.toLocaleString()} plates on the map</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(covered / groups.length) * 100}%` }} /></div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Most spotted</div>
          {top.length === 0 ? <p className="text-sm text-zinc-500">No spots with a district yet.</p> : (
            <ul className="space-y-1.5 text-sm">
              {top.map(({ a, names, n }) => (
                <li key={a.c.join(",")}>
                  <a href={hrefOf(a)} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white">
                    <span className="min-w-0 truncate">{[...new Set(names)].join(" / ")} <span className="font-mono text-xs text-zinc-500">{a.c[0]}</span></span>
                    <span className="tabular-nums text-indigo-300">{n}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="px-1 text-[11px] leading-relaxed text-zinc-600">{country === "germany" ? "Map data: © GeoBasis-DE / BKG (Datenlizenz Deutschland – Namensnennung 2.0), simplified." : country === "austria" ? "Map data: Statistik Austria, CC BY 4.0 (via ginseng666), simplified." : "Map data: Natural Earth (public domain), simplified."}</p>
      </aside>
    </div>
  );
}
