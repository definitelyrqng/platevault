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
  const isNs = value.plateType.endsWith("-ns");                                   // German plates: "-ns" = no seals or stickers
  const pt = isNs ? value.plateType.slice(0, -3) : value.plateType;
  const huMatch = pt.match(/^(.*)-hu(\d\d|0)$/);                          // German plates: "-hu24" = inspection sticker of 2024, "-hu0" = none (front plate)
  const shortMatch = (huMatch ? huMatch[1] : pt).match(/^(.*?)-short$/);           // German plates: "-short" = cut down to the registration (3–8 characters)
  const split = splitSticker(shortMatch ? shortMatch[1] : huMatch ? huMatch[1] : pt);
  const base = split.base === "cz-vanity-single" ? "cz-vanity-single-euro" : split.base;
  const isDeHu = value.country === "germany" && /^(de-(regular|electric|oldtimer|seasonal|seasonal-h|transferable)-(single|double|us|moto|moto-old)|de-din-(din-)?(single|double|us))$/.test(base);
  const huVal = huMatch ? huMatch[2] : "25";
  const isShort = !!shortMatch;
  const deType = (short: boolean, hu: string) => `${base}${short && base === "de-regular-single" ? "-short" : ""}-hu${hu}${isNs ? "-ns" : ""}`;
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
    onChange({ ...value, plateType: a?.stickers?.length ? `${id}-st${mask}` : /^(de-(regular|electric|oldtimer|seasonal|seasonal-h|transferable)-(single|double|us|moto|moto-old)|de-din-(din-)?(single|double|us))$/.test(id) && value.country === "germany" ? `${id}-hu${huVal}` : id });
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

      {value.country === "germany" && (
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={isNs} onChange={(e) => onChange({ ...value, plateType: e.target.checked ? `${pt}-ns` : pt })} className="accent-indigo-500" />
          No seals — remove the state seal and the stickers
        </label>
      )}
      {isDeHu && (
        <div>
          {base === "de-regular-single" && (
            <label className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={isShort} onChange={(e) => onChange({ ...value, plateType: deType(e.target.checked, huVal) })} className="accent-indigo-500" />
              Shortened plate — cut to the length of the registration
            </label>
          )}
          <span className={LABEL}>Inspection sticker (TÜV / HU) — optional</span>
          <p className="mb-2 text-xs text-zinc-500">Choosing the right colour and year is optional and not required.</p>
          <label className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={huVal === "0"} onChange={(e) => onChange({ ...value, plateType: deType(isShort, e.target.checked ? "0" : "25") })} className="accent-indigo-500" />
            Front plate — no inspection sticker, only the state seal
          </label>
          {huVal !== "0" && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {["19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"].map((y) => (
                <button key={y} type="button" aria-pressed={huVal === y} onClick={() => onChange({ ...value, plateType: deType(isShort, y) })}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-colors ${huVal === y ? "border-indigo-500 bg-indigo-950/50 text-indigo-200" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: ["#1ab0ee", "#f5ef12", "#d85c4c", "#f7a0b8", "#18b082", "#e89000"][((Number(y) - 20) % 6 + 6) % 6] }} />
                  20{y}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
