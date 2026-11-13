"use client";

import { useState, useEffect } from "react";
import {
  BULGARIA_FORMATS_FOR, BG_FORMAT_LABELS, BULGARIA_CATEGORIES, BULGARIA_PATTERNS,
  type BulgariacategoryId,
} from "@/app/lib/bulgariaData";
import { maskBelgiumPlate as maskPlate, patternExample } from "@/app/lib/belgiumData";

interface Props {
  category: BulgariacategoryId;
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
export default function BulgariaPlateInput({ category, format, onFormatChange, onChange, variant, onVariantChange, onComplete }: Props) {
  const [text, setText] = useState("");
  const patterns = BULGARIA_PATTERNS[category] ?? [];
  const pattern = patterns[Math.min(variant, patterns.length - 1)] ?? null;
  const formats = BULGARIA_FORMATS_FOR[category];
  const catMeta = BULGARIA_CATEGORIES.find((c) => c.id === category);

  // Reset (and pre-fill the fixed characters) when the category or pattern changes
  useEffect(() => {
    const start = pattern ? maskPlate("", pattern) : "";
    setText(start);
    onChange(start);
    onComplete(pattern ? start.length === pattern.length : false);   // free-text categories become complete once something is typed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, pattern]);

  function handle(v: string) {
    if (!pattern) {                                  // no fixed pattern: free text
      const upper = v.toUpperCase();
      setText(upper); onChange(upper); onComplete(upper.trim().length > 0);
      return;
    }
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
          {formats.map((f) => <option key={f} value={f}>{BG_FORMAT_LABELS[f]}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-zinc-500">Plate text</p>
          <span className="text-[10px] text-zinc-600 italic">{pattern ? "spaces and fixed letters fill in for you" : "type the plate as it is"}</span>
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
          placeholder={pattern ? patternExample(pattern) : (catMeta?.example ?? "C 5096 MK")}
          maxLength={pattern ? pattern.length : 14}
          className={IN} autoComplete="off" spellCheck={false} />
        {catMeta?.hint && <p className="mt-1.5 text-xs text-zinc-600">{catMeta.hint}</p>}
      </div>
    </div>
  );
}
