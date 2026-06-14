"use client";

import { useState, useEffect } from "react";
import {
  BELGIUM_FORMATS_FOR, BE_FORMAT_LABELS,
  detectBelgiumCategory, detect1951Era,
  BELGIUM_1951_ERAS, BELGIUM_CATEGORIES,
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
}

const IN = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:text-center";
const SEL = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600";

export default function BelgiumPlateInput({
  category, era, format,
  onCategoryDetected, onEraDetected, onFormatChange, onChange,
}: Props) {
  const [text, setText] = useState("");

  // Reset text when category changes externally (manual dropdown override)
  useEffect(() => { setText(""); onChange(""); }, [category]);

  const formats = BELGIUM_FORMATS_FOR[category];
  const is1951  = category === "year-1951";
  const catMeta = BELGIUM_CATEGORIES.find((c) => c.id === category);
  const eraData = BELGIUM_1951_ERAS.find((e) => e.id === era) ?? BELGIUM_1951_ERAS[0];

  function handleText(v: string) {
    const upper = v.toUpperCase();
    setText(upper);
    onChange(upper);

    // Auto-detect category (only if not vanity/diplomatic/1951 — those are manual)
    if (category !== "vanity" && category !== "diplomatic" && category !== "year-1951") {
      const detected = detectBelgiumCategory(upper);
      if (detected && detected !== category) onCategoryDetected(detected);
    }

    // Auto-detect 1951 era
    if (is1951) {
      const detectedEra = detect1951Era(upper);
      if (detectedEra && detectedEra !== era) onEraDetected(detectedEra);
    }
  }

  const placeholder = is1951
    ? eraData.placeholder
    : (catMeta?.example ?? "1-ABC-123");

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
          {category !== "vanity" && category !== "diplomatic" && category !== "year-1951" && (
            <span className="text-[10px] text-zinc-600 italic">type detects category</span>
          )}
        </div>
        <input
          value={text}
          onChange={(e) => handleText(e.target.value)}
          placeholder={placeholder}
          maxLength={14}
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
