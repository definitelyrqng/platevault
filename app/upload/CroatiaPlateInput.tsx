"use client";

import { useState, useEffect } from "react";
import {
  CROATIA_FORMATS_FOR, HR_FORMAT_LABELS, CROATIA_CATEGORIES, CROATIA_PATTERNS, croatiaDiplomaticOwner, CROATIA_REGIONS, HR_LETTERS,
  type CroatiacategoryId,
} from "@/app/lib/croatiaData";
import { maskBelgiumPlate as maskPlate, patternExample } from "@/app/lib/belgiumData";

interface Props {
  category: CroatiacategoryId;
  format: string;
  onFormatChange: (fmt: string) => void;
  onChange: (plateText: string) => void;
  /** Which of the category's patterns is selected (one- or two-letter region). */
  variant: number;
  onVariantChange: (i: number) => void;
  /** Whether the text fills the whole pattern. */
  onComplete: (complete: boolean) => void;
}

const IN = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:text-center";
const SEL = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600";

/** Plate number input: pick the layout, then type — dashes and fixed letters fill in for you. */
export default function CroatiaPlateInput({ category, format, onFormatChange, onChange, variant, onVariantChange, onComplete }: Props) {
  const [text, setText] = useState("");
  // like PlatesMania: region and letters are picked from lists, the digits typed
  const structured = ["regular", "foreign", "exceptional", "motorcycle"].includes(category);
  const [region, setRegion] = useState("ZG");
  const [digits, setDigits] = useState("");
  const [l1, setL1] = useState("A");
  const [l2, setL2] = useState("");
  useEffect(() => {
    if (!structured) return;
    const sep = format.startsWith("triple") ? " " : "-";                       // motorcycle: ZG 9619 GU; cars: ZG 543-AA
    const out = digits ? `${region} ${digits}${sep}${l1}${l2}` : "";
    setText(out); onChange(out); onComplete(digits.length >= 1 && !!l1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structured, region, digits, l1, l2, format, category]);
  const patterns = CROATIA_PATTERNS[category] ?? [];
  const pattern = patterns[Math.min(variant, patterns.length - 1)] ?? null;
  const formats = CROATIA_FORMATS_FOR[category];
  const catMeta = CROATIA_CATEGORIES.find((c) => c.id === category);

  // Reset (and pre-fill the fixed characters) when the category or pattern changes
  useEffect(() => {
    if (structured) return;
    const start = pattern ? maskPlate("", pattern) : "";
    setText(start);
    onChange(start);
    onComplete(false);   // free-text categories become complete once something is typed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, pattern]);

  function handle(v: string) {
    if (!pattern) {                                  // no fixed pattern: free text
      const upper = v.toUpperCase().replace(/[^A-ZČĆĐŠŽ0-9 -]/g, "");
      setText(upper); onChange(upper); onComplete(upper.replace(/[ -]/g, "").length >= 3);
      return;
    }
    // Backspace over a fixed character removes it together with what is typed before it
    let raw = v;
    if (v.length < text.length) while (raw && !("X#".includes(pattern[raw.length - 1] ?? "X"))) raw = raw.slice(0, -1);
    const masked = maskPlate(raw, pattern);
    setText(masked);
    onChange(masked);
    onComplete(masked.length >= pattern.length - 3);      // the number may have 1–4 digits
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-zinc-500 mb-1.5">Plate layout</p>
        <select value={format} onChange={(e) => onFormatChange(e.target.value)} className={SEL}>
          {formats.map((f) => <option key={f} value={f}>{HR_FORMAT_LABELS[f]}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-zinc-500">Plate text</p>
          <span className="text-[10px] text-zinc-600 italic">{structured ? "pick the region and letters, type the digits" : pattern ? "spaces and fixed letters fill in for you" : "type it as on the plate, e.g. ZG 543-AA"}</span>
        </div>
        {patterns.length > 1 && (
          <div className="mb-2 flex gap-2">
            {patterns.map((p, i) => (
              <button key={p} type="button" onClick={() => onVariantChange(i)}
                className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs tracking-widest transition-colors ${
                  i === Math.min(variant, patterns.length - 1) ? "border-indigo-500 bg-indigo-600/10 text-indigo-200" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}>{patternExample(p)}</button>
            ))}
          </div>
        )}
        {structured ? (
          <div className="flex flex-wrap items-center gap-2">
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={SEL + " !w-auto"} aria-label="Region">
              {CROATIA_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.city}</option>)}
            </select>
            <input value={digits} onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="1234" maxLength={4}
              className={IN + " !w-24"} aria-label="Digits" autoComplete="off" />
            <select value={l1} onChange={(e) => setL1(e.target.value)} className={SEL + " !w-auto"} aria-label="First letter">
              {HR_LETTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={l2} onChange={(e) => setL2(e.target.value)} className={SEL + " !w-auto"} aria-label="Second letter">
              <option value="">–</option>
              {HR_LETTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        ) : <input value={text} onChange={(e) => handle(e.target.value)}
          placeholder={pattern ? patternExample(pattern) : (catMeta?.example ?? "ZG 543-AA")}
          maxLength={pattern ? pattern.length : 14}
          className={IN} autoComplete="off" spellCheck={false} />}
        {category === "diplomatic" && (() => {
          const owner = croatiaDiplomaticOwner(text);
          return owner
            ? <p className="mt-1.5 text-xs text-emerald-300">Detected: {owner}</p>
            : <p className="mt-1.5 text-xs text-zinc-600">Type the code — the country or organisation is detected for you.</p>;
        })()}
        {catMeta?.hint && <p className="mt-1.5 text-xs text-zinc-600">{catMeta.hint}</p>}
      </div>
    </div>
  );
}
