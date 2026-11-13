"use client";

import { useState, useEffect } from "react";
import {
  BOSNIA_FORMATS_FOR, BA_FORMAT_LABELS, BOSNIA_CATEGORIES, BOSNIA_PATTERNS, bosniaDiplomaticOwner,
  type BosniacategoryId,
} from "@/app/lib/bosniaData";
import { maskBelgiumPlate as maskPlate, patternExample } from "@/app/lib/belgiumData";

interface Props {
  category: BosniacategoryId;
  format: string;
  onFormatChange: (fmt: string) => void;
  onChange: (plateText: string) => void;
  /** Which of the category's patterns is selected (TT- or MT- for testing / portable plates). */
  variant: number;
  onVariantChange: (i: number) => void;
  /** Whether the text fills the whole pattern. */
  onComplete: (complete: boolean) => void;
}

const IN = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:text-center";
const SEL = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600";

/** Plate number input: pick the layout, then type — dashes and fixed letters fill in for you. */
export default function BosniaPlateInput({ category, format, onFormatChange, onChange, variant, onVariantChange, onComplete }: Props) {
  const [text, setText] = useState("");
  const patterns = BOSNIA_PATTERNS[category] ?? [];
  const pattern = patterns[Math.min(variant, patterns.length - 1)] ?? null;
  const formats = BOSNIA_FORMATS_FOR[category];
  const catMeta = BOSNIA_CATEGORIES.find((c) => c.id === category);

  // Reset (and pre-fill the fixed characters) when the category or pattern changes
  useEffect(() => {
    const start = pattern ? maskPlate("", pattern) : "";
    setText(start);
    onChange(start);
    onComplete(pattern ? start.length === pattern.length : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, pattern]);

  function handle(v: string) {
    if (!pattern) return;
    // Backspace over a fixed character removes it together with what is typed before it
    let raw = v;
    if (v.length < text.length) while (raw && !("X#".includes(pattern[raw.length - 1] ?? "X"))) raw = raw.slice(0, -1);
    const masked = maskPlate(raw, pattern);
    setText(masked);
    onChange(masked);
    onComplete(masked.length === pattern.length);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-zinc-500 mb-1.5">Plate layout</p>
        <select value={format} onChange={(e) => onFormatChange(e.target.value)} className={SEL}>
          {formats.map((f) => <option key={f} value={f}>{BA_FORMAT_LABELS[f]}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-zinc-500">Plate text</p>
          <span className="text-[10px] text-zinc-600 italic">dashes and fixed letters fill in for you</span>
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
        <input value={text} onChange={(e) => handle(e.target.value)}
          placeholder={pattern ? patternExample(pattern) : (catMeta?.example ?? "A12-E-345")}
          maxLength={pattern ? pattern.length : 14}
          className={IN} autoComplete="off" spellCheck={false} />
        {category === "diplomatic" && (() => {
          const owner = bosniaDiplomaticOwner(text);
          return owner
            ? <p className="mt-1.5 text-xs text-emerald-300">Detected: {owner}</p>
            : <p className="mt-1.5 text-xs text-zinc-600">Type the code — the country or organisation is detected for you.</p>;
        })()}
        {catMeta?.hint && <p className="mt-1.5 text-xs text-zinc-600">{catMeta.hint}</p>}
      </div>
    </div>
  );
}
