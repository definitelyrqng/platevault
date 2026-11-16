"use client";

import { useMemo } from "react";
import PlateBadge from "@/app/components/PlateBadge";
import { COUNTRY_META } from "@/app/lib/countries";
import { plateTypeOptions } from "@/app/lib/plateTypeOptions";
import { plateArtFor } from "@/app/lib/plateLayout";

export type PlateFields = { country: string; plateType: string; plateText: string; plateRegion: string };

const COUNTRIES = Object.entries(COUNTRY_META).map(([slug, m]) => ({ slug, name: m.name })).sort((a, b) => a.name.localeCompare(b.name));
const INPUT = "h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500 disabled:opacity-50";
const LABEL = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500";

/** Czech plate types end in "-st0".."-st3" (which inspection stickers are on the plate: 1 = red, 2 = green). */
const splitSticker = (t: string) => { const m = t.match(/^(.*?)-st([0-3])$/); return m ? { base: m[1], mask: Number(m[2]) } : { base: t, mask: 3 }; };

/**
 * Everything about the plate of a spot, with a live preview: move it to another country, change the plate type and
 * layout, the text and region, and (Czech plates) the inspection stickers.
 */
export default function PlateEditor({ value, onChange, canMove }: {
  value: PlateFields;
  onChange: (next: PlateFields) => void;
  /** Only admins can move a spot to another country. */
  canMove: boolean;
}) {
  const options = useMemo(() => plateTypeOptions(value.country), [value.country]);
  const split = splitSticker(value.plateType);
  const base = split.base === "cz-vanity-single" ? "cz-vanity-single-euro" : split.base;      // older vanity spots were saved without the euroband suffix
  const mask = split.mask;
  const art = plateArtFor(value.country, base);
  const stickers = art?.stickers ?? [];
  const known = options?.some((o) => o.id === base);

  function setCountry(c: string) {
    const opts = plateTypeOptions(c);
    onChange({ ...value, country: c, plateType: opts?.[0]?.id ?? "" });
  }
  function setType(id: string) {
    const a = plateArtFor(value.country, id);
    onChange({ ...value, plateType: a?.stickers?.length ? `${id}-st${mask}` : id });
  }
  function toggle(bit: number) {
    const next = mask ^ bit;
    onChange({ ...value, plateType: `${base}-st${next}` });
  }

  const sample = options?.find((o) => o.id === base)?.sample;
  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex justify-center rounded-lg bg-zinc-900/60 px-3 py-4">
        <PlateBadge country={value.country} text={value.plateText.trim() || sample || "AB 123"} plateType={value.plateType || null} size="xl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className={LABEL}>Country {!canMove && <span className="normal-case text-zinc-600">(only admins can move a spot)</span>}</span>
          <select className={INPUT} value={value.country} disabled={!canMove} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select></label>

        <label><span className={LABEL}>Plate type</span>
          {options ? (
            <select className={INPUT} value={known ? base : "__other"} onChange={(e) => e.target.value !== "__other" && setType(e.target.value)}>
              {!known && <option value="__other">{value.plateType ? `Other (${value.plateType})` : "Not set"}</option>}
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          ) : (
            <input className={`${INPUT} font-mono text-xs`} value={value.plateType} maxLength={60} onChange={(e) => onChange({ ...value, plateType: e.target.value })} placeholder="type id" />
          )}</label>

        <label><span className={LABEL}>Plate text</span>
          <input className={`${INPUT} font-mono uppercase tracking-wider`} value={value.plateText} maxLength={32} onChange={(e) => onChange({ ...value, plateText: e.target.value.toUpperCase() })} /></label>

        <label><span className={LABEL}>Region code</span>
          <input className={`${INPUT} font-mono uppercase`} value={value.plateRegion} maxLength={10} onChange={(e) => onChange({ ...value, plateRegion: e.target.value.toUpperCase() })} /></label>
      </div>

      {stickers.length > 0 && (
        <div>
          <span className={LABEL}>Inspection stickers on the plate</span>
          <div className="flex flex-wrap gap-2 text-xs">
            {stickers.map((s) => {
              const on = (mask & s.bit) !== 0;
              const red = s.bit === 1;
              return (
                <button key={s.bit} type="button" aria-pressed={on} onClick={() => toggle(s.bit)}
                  className={`rounded-full border px-3 py-1.5 transition-colors ${on
                    ? (red ? "border-red-500/60 bg-red-950/40 text-red-200" : "border-emerald-500/60 bg-emerald-950/40 text-emerald-200")
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}>
                  {on ? "✓" : "+"} {red ? "Red sticker" : "Green sticker"}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
