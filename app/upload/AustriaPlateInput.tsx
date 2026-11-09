"use client";

import { useEffect, useRef, useState } from "react";
import {
  AUSTRIA_PRESELECT_1, AUSTRIA_PRESELECT_2, AUSTRIA_PRESELECT_3,
  getAustriaPreselect1, getAustriaPreselect2, getAustriaPreselect3,
  type AustriaCategoryId,
} from "@/app/lib/austriaData";

/**
 * Segmented plate-number input for Austrian plates. Same behaviour as the Albanian one:
 * boxes jump forward when full and Backspace in an empty box goes back.
 * The layout of the boxes depends on the plate category.
 */

type Kind = "district" | "service" | "state" | "code" | "letters" | "digits" | "alnum";
type Seg = { kind: Kind; len: number; placeholder: string };

const DISTRICT: Seg = { kind: "district", len: 3, placeholder: "District" };
const DIGITS5: Seg = { kind: "digits", len: 5, placeholder: "12345" };
const LETTERS: Seg = { kind: "letters", len: 5, placeholder: "AB" };

export const AUSTRIA_SEGMENTS: Record<AustriaCategoryId, Seg[]> = {
  regular: [DISTRICT, DIGITS5, LETTERS],
  electric: [DISTRICT, DIGITS5, LETTERS],
  export: [DISTRICT, DIGITS5, LETTERS],
  vanity: [DISTRICT, { kind: "letters", len: 5, placeholder: "WUNSCH" }, { kind: "digits", len: 5, placeholder: "1" }],
  "electric-vanity": [DISTRICT, { kind: "letters", len: 5, placeholder: "WUNSCH" }, { kind: "digits", len: 5, placeholder: "1" }],
  official: [{ kind: "service", len: 2, placeholder: "Service" }, DIGITS5, LETTERS],
  provisional: [DISTRICT, DIGITS5, LETTERS, { kind: "digits", len: 2, placeholder: "12" }],
  "1947": [{ kind: "state", len: 2, placeholder: "State" }, { kind: "alnum", len: 6, placeholder: "123456" }],
  "dealer-1947": [{ kind: "state", len: 2, placeholder: "State" }, { kind: "alnum", len: 6, placeholder: "123456" }],
  dealer: [DISTRICT, { kind: "alnum", len: 7, placeholder: "AB123" }],
  diplomatic: [{ kind: "code", len: 4, placeholder: "Code" }, { kind: "digits", len: 5, placeholder: "12345" }],
};

const EXAMPLE_PREFIX: Partial<Record<Kind, string>> = { district: "W", service: "BP", state: "ST", code: "A" };

/** Example text per category, for previews before anything is typed. */
export function austriaExample(category: AustriaCategoryId) {
  const segs = AUSTRIA_SEGMENTS[category] ?? AUSTRIA_SEGMENTS.regular;
  return segs.map((s) => EXAMPLE_PREFIX[s.kind] ?? s.placeholder).join(" ");
}

const clean = (seg: Seg, v: string) =>
  seg.kind === "digits" ? v.replace(/\D/g, "").slice(0, seg.len)
  : seg.kind === "letters" ? v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, seg.len)
  : seg.kind === "alnum" || seg.kind === "code" ? v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, seg.len)
  : v;

const BOX = "h-12 rounded-xl border border-zinc-700 bg-zinc-950 text-center font-mono text-lg font-semibold uppercase tracking-[0.2em] text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-indigo-500 focus:bg-zinc-900";
const SELECT = "h-12 w-40 shrink-0 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500";

const isSelect = (k: Kind) => k === "district" || k === "service" || k === "state";

export default function AustriaPlateInput({
  category,
  onChange,
}: {
  category: AustriaCategoryId;
  onChange: (plateText: string, plateRegion: string) => void;
}) {
  const segs = AUSTRIA_SEGMENTS[category] ?? AUSTRIA_SEGMENTS.regular;
  const layoutKey = segs.map((s) => s.kind + s.len).join("|") + (category === "1947" || category === "dealer-1947" ? "|s3" : "");
  const [vals, setVals] = useState<string[]>(() => segs.map(() => ""));
  const refs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);

  // Keep what was typed when switching between categories with the same boxes
  const lastLayout = useRef(layoutKey);
  useEffect(() => {
    if (lastLayout.current !== layoutKey) {
      lastLayout.current = layoutKey;
      setVals(segs.map(() => ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  useEffect(() => {
    onChange(vals.filter(Boolean).join(" "), vals[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals]);

  const focusNext = (i: number) => refs.current[i + 1]?.focus();
  const focusPrev = (i: number) => refs.current[i - 1]?.focus();
  const setAt = (i: number, v: string) => setVals((cur) => cur.map((c, k) => (k === i ? v : c)));

  const first = segs[0];
  const regionName = !vals[0] ? undefined
    : first.kind === "district" ? getAustriaPreselect1(vals[0])?.name
    : first.kind === "service" ? getAustriaPreselect2(vals[0])?.name
    : first.kind === "state" ? getAustriaPreselect3(vals[0])?.name
    : undefined;

  const options = (kind: Kind) =>
    kind === "district" ? AUSTRIA_PRESELECT_1 : kind === "service" ? AUSTRIA_PRESELECT_2 : AUSTRIA_PRESELECT_3;
  const placeholderFor = (kind: Kind) => (kind === "district" ? "District…" : kind === "service" ? "Service…" : "State…");

  return (
    <div>
      <div className="flex items-center gap-2">
        {segs.map((s, i) => {
          if (isSelect(s.kind)) {
            return (
              <select key={i} ref={(el) => { refs.current[i] = el; }} value={vals[i]}
                onChange={(e) => { setAt(i, e.target.value); if (e.target.value) focusNext(i); }}
                aria-label={placeholderFor(s.kind).replace("…", "")}
                className={SELECT}>
                <option value="">{placeholderFor(s.kind)}</option>
                {options(s.kind).map((r) => <option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
              </select>
            );
          }
          return (
            <input key={i} ref={(el) => { refs.current[i] = el; }}
              value={vals[i]}
              onChange={(e) => {
                const v = clean(s, e.target.value);
                setAt(i, v);
                if (v.length === s.len) focusNext(i);
              }}
              onKeyDown={(e) => { if (e.key === "Backspace" && !vals[i]) focusPrev(i); }}
              placeholder={s.placeholder}
              inputMode={s.kind === "digits" ? "numeric" : "text"}
              autoCapitalize="characters"
              autoComplete="off"
              aria-label={s.kind === "digits" ? "Numbers" : s.kind === "letters" ? "Letters" : s.kind === "code" ? "Diplomatic code" : "Characters"}
              className={`${BOX} min-w-0 ${s.kind === "digits" || s.kind === "alnum" ? "flex-[1.4]" : "flex-1"}`}
            />
          );
        })}
      </div>
      {regionName && <p className="mt-1.5 pl-1 text-xs text-indigo-300">{regionName}, Austria</p>}
    </div>
  );
}
