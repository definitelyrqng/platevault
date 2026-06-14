"use client";

import { useState, useEffect } from "react";
import {
  BOSNIA_FORMATS_FOR, BA_FORMAT_LABELS,
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

function Dash() {
  return <span className="text-zinc-500 font-mono text-lg font-bold select-none">-</span>;
}

export default function BosniaPlateInput({ category, format, onCategoryDetected, onFormatChange, onChange }: Props) {
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [s3, setS3] = useState("");
  const [prov, setProv] = useState<"TT" | "MT">("TT");

  useEffect(() => { setS1(""); setS2(""); setS3(""); }, [category]);

  const formats = BOSNIA_FORMATS_FOR[category];
  const catMeta = BOSNIA_CATEGORIES.find((c) => c.id === category);

  function emit(a: string, b: string, c: string, pr: "TT" | "MT") {
    let text = "";
    if (category === "regular") {
      text = a && b && c ? `${a}-${b}-${c}` : [a, b, c].filter(Boolean).join("-");
    } else if (category === "taxi") {
      text = b ? `TA-${b}` : "TA-";
    } else if (category === "provisional") {
      text = b ? `${pr}-${b}` : `${pr}-`;
    } else {
      text = a && b && c ? `${a}-${b}-${c}` : [a, b, c].filter(Boolean).join("-");
    }
    onChange(text);
  }

  function handleS1(v: string) {
    let s = "";
    if (category === "regular") {
      const cleaned = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const letter = cleaned[0]?.replace(/[^A-Z]/g, "") ?? "";
      const digits = cleaned.slice(1).replace(/[^0-9]/g, "").slice(0, 2);
      s = letter + digits;
    } else {
      s = v.replace(/[^0-9]/g, "").slice(0, 3);
    }
    setS1(s);
    emit(s, s2, s3, prov);
    if (category !== "taxi" && category !== "provisional") {
      const det = detectBosniaCategory(s);
      if (det && det !== category) onCategoryDetected(det);
    }
  }

  function handleS2(v: string) {
    let s = "";
    if (category === "regular" || category === "year-1998") {
      s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 1);
    } else {
      s = v.replace(/[^0-9]/g, "").slice(0, 6);
    }
    setS2(s);
    emit(s1, s, s3, prov);
  }

  function handleS3(v: string) {
    const s = v.replace(/[^0-9]/g, "").slice(0, 3);
    setS3(s);
    emit(s1, s2, s, prov);
  }

  function handleProv(v: "TT" | "MT") {
    setProv(v);
    emit(s1, s2, s3, v);
  }

  return (
    <div className="space-y-3">
      {/* Layout format — only shown if more than one option */}
      {formats.length > 1 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">Plate layout</p>
          <select value={format} onChange={(e) => onFormatChange(e.target.value)} className={SEL + " w-full"}>
            {formats.map((f) => (
              <option key={f} value={f}>{BA_FORMAT_LABELS[f]}</option>
            ))}
          </select>
        </div>
      )}

      {/* Plate text */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-zinc-500">Plate text</p>
          <span className="text-[10px] text-zinc-600 italic">type detects category</span>
        </div>

        {/* Regular: A12-E-345 */}
        {category === "regular" && (
          <div className="flex items-center gap-1.5">
            <input value={s1} onChange={(e) => handleS1(e.target.value)}
              placeholder="A12" maxLength={3} className={IN + " w-16"} />
            <Dash />
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="E" maxLength={1} className={IN + " w-12"} />
            <Dash />
            <input value={s3} onChange={(e) => handleS3(e.target.value)}
              placeholder="345" maxLength={3} inputMode="numeric" className={IN + " w-16"} />
          </div>
        )}

        {/* Taxi: TA-123456 */}
        {category === "taxi" && (
          <div className="flex items-center gap-1.5">
            <span className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-400 select-none">TA</span>
            <Dash />
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="123456" maxLength={6} inputMode="numeric" className={IN + " flex-1"} />
          </div>
        )}

        {/* Provisional: TT/MT-123456 */}
        {category === "provisional" && (
          <div className="flex items-center gap-1.5">
            <select value={prov} onChange={(e) => handleProv(e.target.value as "TT" | "MT")} className={SEL + " w-20"}>
              <option value="TT">TT</option>
              <option value="MT">MT</option>
            </select>
            <Dash />
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="123456" maxLength={6} inputMode="numeric" className={IN + " flex-1"} />
          </div>
        )}

        {/* 1998: 123-A-456 */}
        {category === "year-1998" && (
          <div className="flex items-center gap-1.5">
            <input value={s1} onChange={(e) => handleS1(e.target.value)}
              placeholder="123" maxLength={3} inputMode="numeric" className={IN + " w-16"} />
            <Dash />
            <input value={s2} onChange={(e) => handleS2(e.target.value)}
              placeholder="A" maxLength={1} className={IN + " w-12"} />
            <Dash />
            <input value={s3} onChange={(e) => handleS3(e.target.value)}
              placeholder="456" maxLength={3} inputMode="numeric" className={IN + " w-16"} />
          </div>
        )}

        {catMeta?.hint && <p className="mt-1.5 text-xs text-zinc-600">{catMeta.hint}</p>}
      </div>
    </div>
  );
}
