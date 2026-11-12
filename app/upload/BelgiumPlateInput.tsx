"use client";

import { useState, useEffect } from "react";
import {
  BELGIUM_FORMATS_FOR, BE_FORMAT_LABELS,
  detectBelgiumCategory, detect1951Era,
  BELGIUM_1951_ERAS, BELGIUM_CATEGORIES, BELGIUM_PATTERNS, maskBelgiumPlate, patternExample,
  type BelgiumCategoryId,
} from "@/app/lib/belgiumData";

interface Props {
  category: BelgiumCategoryId;
  era: string;
  format: string;
  onCategoryDetected: (c: BelgiumCategoryId) => void;
  onEraDetected: (era: string) => void;
  onFormatChange: (fmt: string) => void;
  onChange: (plateText: string) => void;
  /** Which of the category's patterns is selected (e.g. Q-AXX-123 or 1-QXX-123). */
  variant: number;
  onVariantChange: (i: number) => void;
  /** Whether the text fills the whole pattern. */
  onComplete: (complete: boolean) => void;
}

const IN = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:text-center";
const SEL = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600";

export default function BelgiumPlateInput({
  category, era, format,
  onCategoryDetected, onEraDetected, onFormatChange, onChange, variant, onVariantChange, onComplete,
}: Props) {
  const [text, setText] = useState("");
  const patterns = BELGIUM_PATTERNS[category];
  const pattern = patterns ? patterns[Math.min(variant, patterns.length - 1)] : null;

  // Reset (and pre-fill the fixed characters) when the category or pattern changes
  useEffect(() => {
    const start = pattern ? maskBelgiumPlate("", pattern) : "";
    setText(start);
    onChange(start);
    onComplete(pattern ? start.length === pattern.length : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, pattern]);

  const formats = BELGIUM_FORMATS_FOR[category];
  const is1951  = category === "year-1951";
  const catMeta = BELGIUM_CATEGORIES.find((c) => c.id === category);
  const eraData = BELGIUM_1951_ERAS.find((e) => e.id === era) ?? BELGIUM_1951_ERAS[0];

  function handleMasked(v: string) {
    if (!pattern) return;
    // Backspace over a fixed character removes it together with what is typed before it
    let raw = v;
    if (v.length < text.length) while (raw && !("X#".includes(pattern[raw.length - 1] ?? "X"))) raw = raw.slice(0, -1);
    const masked = maskBelgiumPlate(raw, pattern);
    setText(masked);
    onChange(masked);
    onComplete(masked.length === pattern.length);
  }

  function handleText(v: string) {
    if (pattern) return handleMasked(v);
    // military plates are digits only
    const upper = category === "military" ? v.replace(/[^0-9]/g, "").slice(0, 6) : v.toUpperCase();
    onComplete(upper.trim().length > 0);
    setText(upper);
    onChange(upper);

    // The category is only ever changed by the user (never guessed from what is typed).

    // Auto-detect 1951 era
    if (is1951) {
      const detectedEra = detect1951Era(upper);
      if (detectedEra && detectedEra !== era) onEraDetected(detectedEra);
    }
  }

  const placeholder = is1951
    ? eraData.placeholder
    : pattern ? patternExample(pattern) : (catMeta?.example ?? "1-ABC-123");

  return (
    <div className="space-y-3">
      {/* Layout format */}
      <div>
        <p className="text-xs text-zinc-500 mb-1.5">Plate layout</p>
        <select value={format} onChange={(e) => onFormatChange(e.target.value)} className={SEL + " w-full"}>
          {formats.map((f) => (
            <option key={f} value={f}>{BE_FORMAT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      {/* 1951 era — shown but auto-updates as user types */}
      {is1951 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-zinc-500">Era / pattern</p>
            <span className="text-[10px] text-zinc-600 italic">auto-detected as you type</span>
          </div>
          <select value={era} onChange={(e) => onEraDetected(e.target.value)} className={SEL + " w-full"}>
            {BELGIUM_1951_ERAS.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Text input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-zinc-500">Plate text</p>
          {pattern && <span className="text-[10px] text-zinc-600 italic">dashes and fixed letters fill in for you</span>}
        </div>
        {patterns && patterns.length > 1 && (
          <div className="mb-2 flex gap-2">
            {patterns.map((p, i) => (
              <button key={p} type="button" onClick={() => onVariantChange(i)}
                className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs tracking-widest transition-colors ${
                  i === Math.min(variant, patterns.length - 1) ? "border-indigo-500 bg-indigo-600/10 text-indigo-200" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}>{patternExample(p)}</button>
            ))}
          </div>
        )}
        <input
          value={text}
          onChange={(e) => handleText(e.target.value)}
          placeholder={placeholder}
          maxLength={pattern ? pattern.length : 14}
          className={IN}
          autoComplete="off"
          spellCheck={false}
        />
        {catMeta?.hint && (
          <p className="mt-1.5 text-xs text-zinc-600">{catMeta.hint}</p>
        )}
      </div>
    </div>
  );
}
