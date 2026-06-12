"use client";

import { useState, useEffect, useCallback } from "react";
import { ALBANIA_REGIONS } from "@/app/lib/albaniaRegions";

interface Props {
  category: string;
  onChange: (plateText: string, plateRegion: string) => void;
}

const IN = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:normal-case placeholder:text-center";
const SEL = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600";

export default function AlbaniaPlateInput({ category, onChange }: Props) {
  const [seg1, setSeg1] = useState("");
  const [seg2, setSeg2] = useState("");
  const [seg3, setSeg3] = useState("");

  const isCar     = category === "Cars (2011\u2013present)";
  const isMoto    = category === "Motorcycles (2011\u2013present)";
  const isTrailer = category === "Trailers (2011\u2013present)";
  const isLegacy  = category === "Cars (1993\u20132010)";

  useEffect(() => { setSeg1(""); setSeg2(""); setSeg3(""); }, [category]);

  const emit = useCallback((s1: string, s2: string, s3: string) => {
    let plateText = "";
    if (isCar)          plateText = [s1, s2, s3].filter(Boolean).join(" ");
    else if (isMoto)    plateText = [s1, s2].filter(Boolean).join(" ");
    else if (isTrailer) plateText = [s1, s1 || s2 ? "R" : "", s2].filter(Boolean).join(" ");
    else if (isLegacy)  plateText = [s1, s2, s3].filter(Boolean).join(" ");
    const plateRegion = isLegacy ? s1 : "";
    onChange(plateText, plateRegion);
  }, [isCar, isMoto, isTrailer, isLegacy, onChange]);

  function onSeg1Letters(v: string) { const s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2); setSeg1(s); emit(s, seg2, seg3); }
  function onSeg1Region(v: string)  { setSeg1(v); emit(v, seg2, seg3); }
  function onSeg2(v: string)        { const s = v.replace(/[^0-9]/g, "").slice(0, 4); setSeg2(s); emit(seg1, s, seg3); }
  function onSeg3(v: string)        { const s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2); setSeg3(s); emit(seg1, seg2, s); }

  const regionDef = isLegacy && seg1 ? ALBANIA_REGIONS.find((r) => r.code === seg1) : undefined;

  if (!isLegacy) {
    return (
      <div className="flex items-center gap-2">
        <input value={seg1} onChange={(e) => onSeg1Letters(e.target.value)} placeholder="AA" maxLength={2} className={IN + " w-14"} />
        {isTrailer && (
          <span className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-500 select-none">R</span>
        )}
        <input value={seg2} onChange={(e) => onSeg2(e.target.value)} placeholder="1234" maxLength={4} inputMode="numeric" className={IN + " flex-1"} />
        {isCar && (
          <input value={seg3} onChange={(e) => onSeg3(e.target.value)} placeholder="AA" maxLength={2} className={IN + " w-14"} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select value={seg1} onChange={(e) => onSeg1Region(e.target.value)} className={SEL + " w-40"}>
          <option value="">Region</option>
          {ALBANIA_REGIONS.map((r) => (
            <option key={r.code} value={r.code}>{r.code} - {r.city}</option>
          ))}
        </select>
        <input value={seg2} onChange={(e) => onSeg2(e.target.value)} placeholder="1234" maxLength={4} inputMode="numeric" className={IN + " flex-1"} />
        <input value={seg3} onChange={(e) => onSeg3(e.target.value)} placeholder="AA" maxLength={2} className={IN + " w-14"} />
      </div>
      {regionDef && (
        <p className="text-xs text-blue-400 pl-1">{regionDef.district}, Albania</p>
      )}
    </div>
  );
}
