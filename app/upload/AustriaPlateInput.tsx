"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AUSTRIA_PRESELECT_1, AUSTRIA_PRESELECT_2, AUSTRIA_PRESELECT_3,
  AUSTRIA_FORMATS_FOR, AT_FORMAT_LABELS,
  type AustriaCategoryId,
} from "@/app/lib/austriaData";

interface Props {
  category: AustriaCategoryId;
  onChange: (plateText: string, plateRegion: string, format: string) => void;
}

const IN = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 text-center uppercase outline-none focus:border-zinc-600 placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-sans placeholder:normal-case";
const SEL = "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600";

export default function AustriaPlateInput({ category, onChange }: Props) {
  const [preselect, setPreselect] = useState("");
  const [seg1, setSeg1] = useState("");
  const [seg2, setSeg2] = useState("");
  const [seg3, setSeg3] = useState("");
  const [format, setFormat] = useState("");

  const formats = AUSTRIA_FORMATS_FOR[category];

  useEffect(() => {
    setPreselect(""); setSeg1(""); setSeg2(""); setSeg3("");
    setFormat(formats[0] ?? "");
  }, [category]);

  useEffect(() => {
    if (!formats.includes(format as never)) setFormat(formats[0] ?? "");
  }, [formats, format]);

  const emit = useCallback((p: string, s1: string, s2: string, s3: string, fmt: string) => {
    let plateText = "";
    if (category === "regular" || category === "electric" || category === "export" || category === "official") {
      plateText = [p, s1, s2].filter(Boolean).join(" ");
    } else if (category === "vanity" || category === "electric-vanity") {
      plateText = [p, s1, s2].filter(Boolean).join(" ");
    } else if (category === "provisional") {
      plateText = [p, s1, s2, s3].filter(Boolean).join(" ");
    } else if (category === "1947" || category === "dealer-1947" || category === "dealer") {
      plateText = [p, s1].filter(Boolean).join(" ");
    } else if (category === "diplomatic") {
      plateText = [p, s1].filter(Boolean).join(" ");
    }
    onChange(plateText, p, fmt);
  }, [category, onChange]);

  function onPreselect(v: string) { setPreselect(v); emit(v, seg1, seg2, seg3, format); }
  function onFormat(v: string)    { setFormat(v);    emit(preselect, seg1, seg2, seg3, v); }
  function onNums1(v: string)    { const s = v.replace(/[^0-9]/g, "").slice(0, 5);  setSeg1(s); emit(preselect, s, seg2, seg3, format); }
  function onLetters1(v: string) { const s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5); setSeg1(s); emit(preselect, s, seg2, seg3, format); }
  function onLetters2(v: string) { const s = v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5); setSeg2(s); emit(preselect, seg1, s, seg3, format); }
  function onNums2(v: string)    { const s = v.replace(/[^0-9]/g, "").slice(0, 5);  setSeg2(s); emit(preselect, seg1, s, seg3, format); }
  function onExtra(v: string)    { const s = v.replace(/[^0-9]/g, "").slice(0, 2);  setSeg3(s); emit(preselect, seg1, seg2, s, format); }
  function onAlpha6(v: string)   { const s = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6); setSeg1(s); emit(preselect, s, seg2, seg3, format); }
  function onAlpha7(v: string)   { const s = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7); setSeg1(s); emit(preselect, s, seg2, seg3, format); }
  function onDiploCode(v: string){ const s = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4); setPreselect(s); emit(s, seg1, seg2, seg3, format); }

  function Preselect1() {
    return (
      <select value={preselect} onChange={(e) => onPreselect(e.target.value)} className={SEL + " w-40"}>
        <option value="">District</option>
        {AUSTRIA_PRESELECT_1.map((r) => <option key={r.code} value={r.code}>{r.code} - {r.name}</option>)}
      </select>
    );
  }
  function Preselect2() {
    return (
      <select value={preselect} onChange={(e) => onPreselect(e.target.value)} className={SEL + " w-48"}>
        <option value="">Service</option>
        {AUSTRIA_PRESELECT_2.map((r) => <option key={r.code} value={r.code}>{r.code} - {r.name}</option>)}
      </select>
    );
  }
  function Preselect3() {
    return (
      <select value={preselect} onChange={(e) => onPreselect(e.target.value)} className={SEL + " w-44"}>
        <option value="">Federal state</option>
        {AUSTRIA_PRESELECT_3.map((r) => <option key={r.code} value={r.code}>{r.code} - {r.name}</option>)}
      </select>
    );
  }
  function FormatSelect() {
    return (
      <select value={format} onChange={(e) => onFormat(e.target.value)} className={SEL + " w-full"}>
        {formats.map((f) => <option key={f} value={f}>{AT_FORMAT_LABELS[f]}</option>)}
      </select>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-zinc-500 mb-1.5">Plate format</p>
        <FormatSelect />
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-1.5">Plate text</p>

        {/* regular / electric / export */}
        {(category === "regular" || category === "electric" || category === "export") && (
          <div className="flex items-center gap-2">
            <Preselect1 />
            <input value={seg1} onChange={(e) => onNums1(e.target.value)} placeholder="12345" maxLength={5} inputMode="numeric" className={IN + " w-24"} />
            <input value={seg2} onChange={(e) => onLetters2(e.target.value)} placeholder="ABCDE" maxLength={5} className={IN + " w-24"} />
          </div>
        )}

        {/* vanity / electric-vanity */}
        {(category === "vanity" || category === "electric-vanity") && (
          <div className="flex items-center gap-2">
            <Preselect1 />
            <input value={seg1} onChange={(e) => onLetters1(e.target.value)} placeholder="AAAAA" maxLength={5} className={IN + " w-24"} />
            <input value={seg2} onChange={(e) => onNums2(e.target.value)} placeholder="12345" maxLength={5} inputMode="numeric" className={IN + " w-24"} />
          </div>
        )}

        {/* official */}
        {category === "official" && (
          <div className="flex items-center gap-2">
            <Preselect2 />
            <input value={seg1} onChange={(e) => onNums1(e.target.value)} placeholder="12345" maxLength={5} inputMode="numeric" className={IN + " w-24"} />
            <input value={seg2} onChange={(e) => onLetters2(e.target.value)} placeholder="ABCDE" maxLength={5} className={IN + " w-24"} />
          </div>
        )}

        {/* provisional */}
        {category === "provisional" && (
          <div className="flex items-center gap-2">
            <Preselect1 />
            <input value={seg1} onChange={(e) => onNums1(e.target.value)} placeholder="12345" maxLength={5} inputMode="numeric" className={IN + " w-20"} />
            <input value={seg2} onChange={(e) => onLetters2(e.target.value)} placeholder="ABCDE" maxLength={5} className={IN + " w-20"} />
            <input value={seg3} onChange={(e) => onExtra(e.target.value)} placeholder="12" maxLength={2} inputMode="numeric" className={IN + " w-14"} />
          </div>
        )}

        {/* 1947 / dealer-1947 */}
        {(category === "1947" || category === "dealer-1947") && (
          <div className="flex items-center gap-2">
            <Preselect3 />
            <input value={seg1} onChange={(e) => onAlpha6(e.target.value)} placeholder="XXXXXX" maxLength={6} className={IN + " flex-1"} />
          </div>
        )}

        {/* dealer */}
        {category === "dealer" && (
          <div className="flex items-center gap-2">
            <Preselect1 />
            <input value={seg1} onChange={(e) => onAlpha7(e.target.value)} placeholder="XXXXXXX" maxLength={7} className={IN + " flex-1"} />
          </div>
        )}

        {/* diplomatic */}
        {category === "diplomatic" && (
          <div className="flex items-center gap-2">
            <input value={preselect} onChange={(e) => onDiploCode(e.target.value)} placeholder="Code" maxLength={4} className={IN + " w-20"} />
            <input value={seg1} onChange={(e) => onNums1(e.target.value)} placeholder="12345" maxLength={5} inputMode="numeric" className={IN + " flex-1"} />
          </div>
        )}
      </div>
    </div>
  );
}
