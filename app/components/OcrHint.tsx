"use client";

import { useEffect, useState } from "react";

// ── Plate scoring ─────────────────────────────────────────────────────────────
function scorePlate(raw: string): number {
  const t = raw.toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const noSpace = t.replace(/\s/g, "");

  if (noSpace.length < 4 || noSpace.length > 10) return 0;
  if (!/[A-Z]/.test(t) && !/^\d{6,8}$/.test(noSpace)) return 0;
  if (!/\d/.test(t) && !/^[A-Z]{5,}$/.test(noSpace)) return 0;

  const scored: [RegExp, number][] = [
    // ── Czech ──
    [/^\d[A-Z]\d \d{4}$/,                99], // 6P9 2125
    [/^\d[A-Z]{2} \d{4}[A-Z]?$/,         97], // 1AB 2345
    [/^\d{2}[A-Z] \d{4}[A-Z]?$/,         95], // 11R 0466
    [/^\d[A-Z]\d\d{4}$/,                  90], // no-space fallback
    // ── Croatian / Balkan ──
    [/^[A-Z]{1,3} \d{3,4} [A-Z]{1,3}$/,  96], // ZG 1234 AB
    // ── German ──
    [/^[A-Z]{1,3}-[A-Z]{1,3} \d{3,4}[A-Z]?$/, 94],  // M-GT 336
    [/^[A-Z]{1,3} [A-Z]{1,2} \d{3,4}$/,  92], // MUC AB 123
    // ── Bulgarian ──
    [/^[A-Z]{1,2} \d{4} [A-Z]{2}$/,      93], // CB 1234 AB
    [/^[A-Z]{1,2}\d{4}[A-Z]{2}$/,         88],
    // ── Generic ──
    [/^[A-Z]{2,3} \d{4,5}$/,             85],
    [/^\d{3,5} [A-Z]{2,3}$/,             85],
    [/^[A-Z]{2}\d{3,5}$/,                72],
    [/^\d{3,5}[A-Z]{2}$/,                72],
    [/^[A-Z0-9]{5,9}$/,                  45],
  ];

  const lengthBonus = noSpace.length >= 5 && noSpace.length <= 8 ? 3 : 0;
  let best = 0;
  for (const [re, pts] of scored) {
    if (re.test(t)) best = Math.max(best, pts + lengthBonus);
  }
  return best;
}

function extractBest(rawOcr: string): { text: string; score: number } {
  const text = rawOcr.toUpperCase().replace(/[^A-Z0-9\s\n]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = text.split(" ").filter(Boolean);
  const candidates: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    candidates.push(tokens[i]);
    if (i + 1 < tokens.length) candidates.push(tokens[i] + " " + tokens[i + 1]);
    if (i + 2 < tokens.length) candidates.push(tokens[i] + " " + tokens[i + 1] + " " + tokens[i + 2]);
    if (i + 1 < tokens.length) candidates.push(tokens[i] + tokens[i + 1]); // merged
  }
  let bestScore = 0, bestText = "";
  for (const c of candidates) {
    const s = scorePlate(c);
    if (s > bestScore) { bestScore = s; bestText = c.trim(); }
  }
  return { text: bestText, score: bestScore };
}

function getImageSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ w: 800, h: 600 }); };
    img.src = url;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OcrHint({
  file,
  onSuggest,
}: {
  file: File | null;
  onSuggest?: (text: string) => void;
}) {
  const [status, setStatus]     = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [detected, setDetected] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!file) { setStatus("idle"); setDetected(""); setErrorMsg(""); return; }

    let cancelled = false;
    setStatus("scanning"); setDetected(""); setErrorMsg("");

    (async () => {
      try {
        // Get dimensions without canvas work (just Image object, very fast)
        const { w, h } = await getImageSize(file);
        if (cancelled) return;

        const Tesseract = await import("tesseract.js");

        // PSM 7 = single line (best for a cropped plate strip)
        // PSM 6 = single uniform block (good fallback)
        const worker = await Tesseract.createWorker("eng", 1, {
          logger: () => {},
        });

        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -",
          tessedit_pageseg_mode: "7" as never,
        });

        // Strategic strip zones (left/top/width/height) — no canvas work!
        // Strip height = 12% of image; sweep bottom-half + middle for front-on shots
        const sh = Math.round(h * 0.12);
        const sx = Math.round(w * 0.04);
        const sw = Math.round(w * 0.92);

        const zones: { left: number; top: number; width: number; height: number; psm?: string }[] = [
          { left: sx, top: Math.round(h * 0.62), width: sw, height: sh },  // bottom-third (most common)
          { left: sx, top: Math.round(h * 0.72), width: sw, height: sh },
          { left: sx, top: Math.round(h * 0.52), width: sw, height: sh },
          { left: sx, top: Math.round(h * 0.42), width: sw, height: sh },  // front-on
          { left: sx, top: Math.round(h * 0.30), width: sw, height: sh },  // very front-on
          { left: sx, top: Math.round(h * 0.82), width: sw, height: sh },  // very low
        ];

        let bestScore = 0;
        let bestPlate = "";

        // PSM 7 strips
        for (const rect of zones) {
          if (cancelled) break;
          const { data: { text } } = await worker.recognize(file, { rectangle: rect });
          const { text: plate, score } = extractBest(text);
          if (score > bestScore) { bestScore = score; bestPlate = plate; }
          if (bestScore >= 97) break;
        }

        // PSM 6 fallback on wider bands if still not confident
        if (!cancelled && bestScore < 60) {
          await worker.setParameters({ tessedit_pageseg_mode: "6" as never });
          const widerZones = [
            { left: sx, top: Math.round(h * 0.50), width: sw, height: Math.round(h * 0.30) },
            { left: 0,  top: 0,                    width: w,  height: h }, // full image
          ];
          for (const rect of widerZones) {
            if (cancelled) break;
            const { data: { text } } = await worker.recognize(file, { rectangle: rect });
            const { text: plate, score } = extractBest(text);
            if (score > bestScore) { bestScore = score; bestPlate = plate; }
            if (bestScore >= 80) break;
          }
        }

        await worker.terminate();
        if (cancelled) return;

        if (!bestPlate || bestScore < 45) {
          setErrorMsg("No plate detected — try a clearer photo");
          setStatus("error");
          return;
        }
        setDetected(bestPlate);
        setStatus("done");
      } catch (e: unknown) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : "OCR failed");
          setStatus("error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [file]);

  if (status === "idle") return null;

  if (status === "scanning") return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-500">
      <svg className="h-3 w-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Scanning plate…
    </div>
  );

  if (status === "error") return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-400">
      ⚠ {errorMsg}
    </div>
  );

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-indigo-900/60 bg-indigo-950/30 px-3 py-2 text-xs">
      <span className="text-zinc-500">Detected:</span>
      <span className="font-mono font-semibold tracking-widest text-indigo-300">{detected}</span>
      {onSuggest && (
        <button
          type="button"
          onClick={() => onSuggest(detected)}
          className="ml-auto font-medium text-indigo-400 transition-colors hover:text-indigo-200"
        >
          Use this →
        </button>
      )}
    </div>
  );
}
