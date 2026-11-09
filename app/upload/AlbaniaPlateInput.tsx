"use client";

import { useEffect, useRef, useState } from "react";
import { ALBANIA_REGIONS } from "@/app/lib/albaniaRegions";

/**
 * Segmented plate-number input for Albanian plates.
 * Boxes jump forward when full, Backspace in an empty box goes back, and
 * pasting a whole plate ("AB123CD", "AB 123 CD") fills every box.
 */

type Seg = { kind: "letters" | "digits" | "region" | "fixed"; len: number; placeholder: string; fixed?: string };

/** Segment layout per plate type. */
export const ALBANIA_SEGMENTS: Record<string, Seg[]> = {
  "car-2011-standard":   [{ kind: "letters", len: 2, placeholder: "AA" }, { kind: "digits", len: 3, placeholder: "123" }, { kind: "letters", len: 2, placeholder: "AB" }],
  "car-2011-double":     [{ kind: "letters", len: 2, placeholder: "AA" }, { kind: "digits", len: 3, placeholder: "123" }, { kind: "letters", len: 2, placeholder: "AB" }],
  "car-2011-us":         [{ kind: "letters", len: 2, placeholder: "AA" }, { kind: "digits", len: 3, placeholder: "123" }, { kind: "letters", len: 2, placeholder: "AB" }],
  "moto-2011":           [{ kind: "letters", len: 2, placeholder: "AA" }, { kind: "digits", len: 4, placeholder: "1234" }],
  "trailer-2011-single": [{ kind: "letters", len: 2, placeholder: "AA" }, { kind: "fixed", len: 1, placeholder: "R", fixed: "R" }, { kind: "digits", len: 4, placeholder: "1234" }],
  "trailer-2011-double": [{ kind: "letters", len: 2, placeholder: "AA" }, { kind: "fixed", len: 1, placeholder: "R", fixed: "R" }, { kind: "digits", len: 4, placeholder: "1234" }],
  "car-1993-single":     [{ kind: "region", len: 2, placeholder: "Region" }, { kind: "digits", len: 4, placeholder: "1234" }, { kind: "letters", len: 2, placeholder: "AA" }],
};

/** Example text per type, for previews before anything is typed. */
export function albaniaExample(plateType: string) {
  const segs = ALBANIA_SEGMENTS[plateType] ?? ALBANIA_SEGMENTS["car-2011-standard"];
  return segs.map((s) => (s.kind === "region" ? "TR" : s.placeholder)).join(" ");
}

const clean = (seg: Seg, v: string) =>
  seg.kind === "digits" ? v.replace(/\D/g, "").slice(0, seg.len)
  : seg.kind === "letters" ? v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, seg.len)
  : v;

const BOX = "h-12 rounded-xl border border-zinc-700 bg-zinc-950 text-center font-mono text-lg font-semibold uppercase tracking-[0.2em] text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-indigo-500 focus:bg-zinc-900";

export default function AlbaniaPlateInput({
  plateType,
  onChange,
}: {
  plateType: string;
  onChange: (plateText: string, plateRegion: string) => void;
}) {
  const segs = ALBANIA_SEGMENTS[plateType] ?? ALBANIA_SEGMENTS["car-2011-standard"];
  const layoutKey = segs.map((s) => s.kind + s.len).join("|");
  const [vals, setVals] = useState<string[]>(() => segs.map((s) => s.fixed ?? ""));
  const refs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);

  // Keep what was typed when switching between types with the same boxes
  // (e.g. single-line ↔ two-line); reset otherwise.
  const lastLayout = useRef(layoutKey);
  useEffect(() => {
    if (lastLayout.current !== layoutKey) {
      lastLayout.current = layoutKey;
      setVals(segs.map((s) => s.fixed ?? ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  useEffect(() => {
    const text = vals.filter(Boolean).join(" ");
    const region = segs[0]?.kind === "region" ? vals[0] : "";
    // A fixed "R" alone isn't a plate yet
    const typed = vals.some((v, i) => v && segs[i]?.kind !== "fixed");
    onChange(typed ? text : "", region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals]);

  const editable = (i: number) => segs[i] && segs[i].kind !== "fixed";
  function focusNext(i: number) {
    for (let j = i + 1; j < segs.length; j++) if (editable(j)) { refs.current[j]?.focus(); return; }
  }
  function focusPrev(i: number) {
    for (let j = i - 1; j >= 0; j--) if (editable(j)) { refs.current[j]?.focus(); return; }
  }

  /** Spread "AB123CD" / "AB 123 CD" over the boxes starting at box i. */
  function distribute(i: number, raw: string) {
    const next = [...vals];
    let rest = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let lastFilled = i;
    for (let k = i; k < segs.length && rest; k++) {
      const s = segs[k];
      if (s.kind === "fixed") { if (rest.startsWith(s.fixed!)) rest = rest.slice(1); continue; }
      if (s.kind === "region") continue;
      const m = rest.match(s.kind === "digits" ? /^\d+/ : /^[A-Z]+/);
      if (!m) break;
      next[k] = m[0].slice(0, s.len);
      rest = rest.slice(next[k].length);
      lastFilled = k;
    }
    setVals(next);
    if (next[lastFilled]?.length === segs[lastFilled].len) focusNext(lastFilled);
    else refs.current[lastFilled]?.focus();
  }

  function set(i: number, raw: string) {
    // More than fits (fast typing, autofill, mobile keyboards) → spill into the next boxes
    if (raw.replace(/[^A-Za-z0-9]/g, "").length > segs[i].len) { distribute(i, raw); return; }
    const v = clean(segs[i], raw);
    setVals((cur) => cur.map((c, k) => (k === i ? v : c)));
    if (v.length === segs[i].len) focusNext(i);
  }

  /** Paste a whole plate anywhere → distribute over the boxes. */
  function onPaste(i: number, e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text");
    if (text.replace(/[^A-Za-z0-9]/g, "").length <= segs[i].len) return; // normal paste into one box
    e.preventDefault();
    distribute(i, text);
  }

  const regionDef = segs[0]?.kind === "region" && vals[0] ? ALBANIA_REGIONS.find((r) => r.code === vals[0]) : undefined;

  return (
    <div>
      <div className="flex items-center gap-2">
        {segs.map((s, i) => {
          if (s.kind === "fixed") {
            return (
              <span key={i} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-lg font-semibold text-zinc-500" title="Always R on trailer plates">
                {s.fixed}
              </span>
            );
          }
          if (s.kind === "region") {
            return (
              <select key={i} ref={(el) => { refs.current[i] = el; }} value={vals[i]}
                onChange={(e) => { const v = e.target.value; setVals((cur) => cur.map((c, k) => (k === i ? v : c))); if (v) focusNext(i); }}
                aria-label="Region code"
                className="h-12 w-36 shrink-0 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500">
                <option value="">Region…</option>
                {ALBANIA_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.city}</option>)}
              </select>
            );
          }
          return (
            <input key={i} ref={(el) => { refs.current[i] = el; }}
              value={vals[i]}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !vals[i]) focusPrev(i); }}
              onPaste={(e) => onPaste(i, e)}
              placeholder={s.placeholder}
              inputMode={s.kind === "digits" ? "numeric" : "text"}
              autoCapitalize="characters"
              autoComplete="off"
              aria-label={s.kind === "digits" ? "Numbers" : "Letters"}
              className={`${BOX} min-w-0 ${s.kind === "digits" ? "flex-[1.4]" : "flex-1"}`}
            />
          );
        })}
      </div>
      {regionDef && <p className="mt-1.5 pl-1 text-xs text-indigo-300">{regionDef.district}, Albania</p>}
    </div>
  );
}
