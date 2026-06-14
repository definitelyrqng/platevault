"use client";

import { useState, useEffect } from "react";
import {
  BOSNIA_FORMATS, BA_FORMAT_LABELS,
  BOSNIA_CATEGORIES, detectBosniaCategory,
  type BosniacategoryId,
} from "@/app/lib/bosniaData";

interface Props {
  category: BosniacategoryId;
  format: string;
  onCategoryDetected: (c: BosniacategoryId) => void;
  onFormatChange: (fmt: string) => void;
  onChange: (plateText: string) => void;
}

const IN  = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:text-center";
const SEL = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600";
const DASH = <span className="text-zinc-500 font-mono text-lg font-bold select-none">-</span>;

export default function BosniaPlateInput({ category, format, onCategoryDetected, onFormatChange, onChange }: Props) {
  // Segments for each category
  const [s1, setS1] = useState(""); // Regular: letter+digits prefix | 1998: digits
  const [s2, setS2] = useState(""); // Regular: canton letter | 1998: letter | Taxi/Prov: digits
  const [s3, setS3] = useState(""); // Regular: digits | 1998: digits
  const [prov, setProv] = useState<"TT"|"MT">("TT"); // Provisional prefix

  useEffect(() => { setS1(""); setS2(""); setS3(""); }, [category]);

  function emit(a: string, b: string, c: string, pr: "TT"|"MT") {
    let text = "";
    if (category === "regular") {
      // A12-E-345
      const parts = [a, b, c].filter(Boolean);
      text = a && b && c ? `${a}-${b}-${c}` : parts.join("-");
    } else if (category === "taxi") {
      text = b ? `TA-${b}` : "TA-";
    } else if (category === "provisional") {
      text = b ? `${pr}-${b}` : `${pr}-`;
    } else {
      // 1998: 123-A-456
      const parts = [a, b, c].filter(Boolean);
      text = a && b && c ? `${a}-${b}-${c}` : parts.join("-");
    }
    onChange(text);
  }

  function handleS1(v: string) {
    let s = "";
    if (category === "regular") {
      // first char letter, rest digits, max 3
      const cleaned = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const letter = cleaned[0] ? (cleaned[0].replace(/[^A-Z]/g, "") || "") : "";
      const digits = cleaned.slice(1).replace(/[^0-9]/g, "").slice(0, 2);
      s = letter + digits;
    } else {
      s = v.replace(/[^0-9]/g, "").slice(0, 3);
    }
    setS1(s); emit(s, s2, s3, prov);
    // auto-detect only for regular (letter start)
    if (category !== "taxi" && category !== "provisional") {
      const det = detectBosniaCategory(s);
      if (det && det !== category) onCategoryDetected(det);
    }
  }
  function handleS2(v: string) {
    let s = "";
    if (category === "regular") s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 1);
    else if (category === "year-1998") s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 1);
    else s = v.replace(/[^0-9]/g, "").slice(0, 6); // taxi / provisional
    setS2(s); emit(s1, s, s3, prov);
  }
  function handleS3(v: string) {
    const s = v.replace(/[^0-9]/g, "").slice(0, 3);
    setS3(s); emit(s1, s2, s, prov);
  }
  function handleProv(v: "TT"|"MT") { setProv(v); emit(s1, s2, s3, v); }

  const catMeta = BOSNIA_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="space-y-3">
      {/* Layout format */}
      <div>
        <p className="text-xs text-zinc-500 mb-1.5">Plate layout</p>
        <select value={format} onChange={(e) => onFormatChange(e.target.value)} className={SEL + " w-full"}>
          {BOSNIA_FORMATS.map((f) => (
            <option key={f} value={f}>{BA_FORMAT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      {/* Plate text */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-zinc-500">Plate text</p>
          <span className="text-[10px] text-zinc-600 italic">type detects category</span>
        </div>

        {/* Regular: A12 - E - 345 */}
        {category === "regular" && (
          <div className="flex items-center gap-1.5">
            <input value={s1} onChange={(e) => handleS1(e.target.value)}
              placeholder="A12" maxLength={3} className={IN + " w-16"} />
            {DASH}
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="E" maxLength={1} className={IN + " w-12"} />
            {DASH}
            <input value={s3} onChange={(e) => handleS3(e.target.value)}
              placeholder="345" maxLength={3} inputMode="numeric" className={IN + " w-16"} />
          </div>
        )}

        {/* Taxi: TA - 123456 */}
        {category === "taxi" && (
          <div className="flex items-center gap-1.5">
            <span className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-400 select-none">TA</span>
            {DASH}
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="123456" maxLength={6} inputMode="numeric" className={IN + " flex-1"} />
          </div>
        )}

        {/* Provisional: TT/MT - 123456 */}
        {category === "provisional" && (
          <div className="flex items-center gap-1.5">
            <select value={prov} onChange={(e) => handleProv(e.target.value as "TT"|"MT")} className={SEL + " w-20"}>
              <option value="TT">TT</option>
              <option value="MT">MT</option>
            </select>
            {DASH}
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="123456" maxLength={6} inputMode="numeric" className={IN + " flex-1"} />
          </div>
        )}

        {/* 1998: 123 - A - 456 */}
        {category === "year-1998" && (
          <div className="flex items-center gap-1.5">
            <input value={s1} onChange={(e) => handleS1(e.target.value)}
              placeholder="123" maxLength={3} inputMode="numeric" className={IN + " w-16"} />
            {DASH}
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="A" maxLength={1} className={IN + " w-12"} />
            {DASH}
            <input value={s3} onChange={(e) => handleS3(e.target.value)}
              placeholder="456" maxLength={3} inputMode="numeric" className={IN + " w-16"} />
          </div>
        )}

        {catMeta?.hint && <p className="mt-1.5 text-xs text-zinc-600">{catMeta.hint}</p>}
      </div>
    </div>
  );
}
