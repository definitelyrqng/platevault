"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  category: string;
  onChange: (plateText: string, plateRegion: string) => void;
}

const IN = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:normal-case placeholder:text-center";

export default function AlbaniaPlateInput({ category, onChange }: Props) {
  const [seg1, setSeg1] = useState(""); // region letters (AA)
  const [seg2, setSeg2] = useState(""); // numbers (1234)
  const [seg3, setSeg3] = useState(""); // suffix letters for cars (AB)

  const isCar     = category === "Cars (2011–present)";
  const isMoto    = category === "Motorcycles (2011–present)";
  const isTrailer = category === "Trailers (2011–present)";
  const isLegacy  = category === "Cars (1993–2010)";

  // Reset fields when category changes
  useEffect(() => { setSeg1(""); setSeg2(""); setSeg3(""); }, [category]);

  const emit = useCallback((s1: string, s2: string, s3: string) => {
    let plateText = "";
    if (isCar)      plateText = [s1, s2, s3].filter(Boolean).join(" ");
    else if (isMoto) plateText = [s1, s2].filter(Boolean).join(" ");
    else if (isTrailer) plateText = [s1, s1 || s2 ? "R" : "", s2].filter(Boolean).join(" ");
    else              plateText = s1; // legacy free text

    // Region only applies to legacy plates (1993-2010), not 2011+ formats
    onChange(plateText, "");
  }, [isCar, isMoto, isTrailer, isLegacy, onChange]);

  function onSeg1(v: string) { const s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2); setSeg1(s); emit(s, seg2, seg3); }
  function onSeg2(v: string) { const s = v.replace(/[^0-9]/g, "").slice(0, 4); setSeg2(s); emit(seg1, s, seg3); }
  function onSeg3(v: string) { const s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2); setSeg3(s); emit(seg1, seg2, s); }

  // ── Legacy: free-text input ──────────────────────────────────────────
  if (isLegacy) {
    return (
      <input
        value={seg1}
        onChange={(e) => { const v = e.target.value.toUpperCase(); setSeg1(v); emit(v, "", ""); }}
        placeholder="BC 1234 AA"
        maxLength={20}
        className={IN + " w-full"}
      />
    );
  }

  // ── Structured input ─────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">

        {/* Region code — always first, always 2 letters */}
        <input
          value={seg1}
          onChange={(e) => onSeg1(e.target.value)}
          placeholder="AA"
          maxLength={2}
          className={IN + " w-14"}
        />

        {/* Fixed "R" badge for trailers */}
        {isTrailer && (
          <span className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-500 select-none">
            R
          </span>
        )}

        {/* Number field */}
        <input
          value={seg2}
          onChange={(e) => onSeg2(e.target.value)}
          placeholder="1234"
          maxLength={4}
          inputMode="numeric"
          className={IN + " flex-1"}
        />

        {/* Suffix letters — cars only */}
        {isCar && (
          <input
            value={seg3}
            onChange={(e) => onSeg3(e.target.value)}
            placeholder="AA"
            maxLength={2}
            className={IN + " w-14"}
          />
        )}
      </div>

    </div>
  );
}
