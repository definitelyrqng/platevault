"use client";

import { useEffect, useState } from "react";

// ── Image preprocessing ───────────────────────────────────────────────────────
type CropVariant = { blob: Blob; label: string; psm: "7" | "11" };

async function preprocessImage(file: File): Promise<CropVariant[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;

      // Strategy: many thin PSM-7 strips sliding across likely plate zones,
      // then a couple of wider PSM-11 fallbacks.
      // Strip height = 10% (tight) to avoid grabbing bumper text alongside the plate.
      // Scale 3x so small plates still have enough resolution.
      const SH = Math.floor(h * 0.10); // strip height = 10%
      const X0 = Math.floor(w * 0.05);
      const SW = Math.floor(w * 0.90);

      const regions: { sx: number; sy: number; sw: number; sh: number; psm: "7" | "11" }[] = [];

      // Thin strips every 5% from 40% to 85% down (rear & front plates)
      for (const yPct of [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]) {
        regions.push({ sx: X0, sy: Math.floor(h * yPct), sw: SW, sh: SH, psm: "7" });
      }
      // Also try middle zone for front-on shots
      for (const yPct of [0.25, 0.30, 0.35]) {
        regions.push({ sx: X0, sy: Math.floor(h * yPct), sw: SW, sh: SH, psm: "7" });
      }
      // Wider fallback zones (PSM 11 — finds any sparse text)
      regions.push({ sx: Math.floor(w*0.05), sy: Math.floor(h*0.45), sw: Math.floor(w*0.90), sh: Math.floor(h*0.40), psm: "11" });
      regions.push({ sx: 0, sy: 0, sw: w, sh: h, psm: "11" });

      let pending = 0;
      const variants: CropVariant[] = [];

      // For each region: normal contrast (2.5×) + high contrast (5×) + inverted high contrast
      regions.forEach(({ sx, sy, sw, sh, psm }) => {
        const SCALE = 3;

        const processContrast = (contrast: number, invert: boolean) => {
          pending++;
          const canvas = document.createElement("canvas");
          canvas.width  = Math.max(1, sw) * SCALE;
          canvas.height = Math.max(1, sh) * SCALE;
          const ctx = canvas.getContext("2d")!;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

          const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = id.data;
          for (let i = 0; i < d.length; i += 4) {
            let gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
            gray = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
            if (invert) gray = 255 - gray;
            d[i] = d[i+1] = d[i+2] = gray;
          }
          ctx.putImageData(id, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) variants.push({ blob, label: `psm${psm}-c${contrast}${invert?"-inv":""}`, psm });
            if (--pending === 0) resolve(variants);
          }, "image/png");
        };

        processContrast(2.5, false);
        processContrast(5.0, false);
        processContrast(5.0, true);   // inverted: helps on dark-background plates
      });
    };
    img.src = url;
  });
}

// ── Plate scoring ─────────────────────────────────────────────────────────────
function scorePlate(raw: string): number {
  const t = raw.toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const noSpace = t.replace(/\s/g, "");

  if (noSpace.length < 4 || noSpace.length > 10) return 0;
  if (!/[A-Z]/.test(t) && !/^\d{6,7}$/.test(noSpace)) return 0;
  if (!/\d/.test(t) && !/^[A-Z]{5,}$/.test(noSpace)) return 0;

  const scored: [RegExp, number][] = [
    // ── Czech formats ──
    [/^\d[A-Z]\d \d{4}$/,           99], // 6P9 2125 — digit·letter·digit + 4digits (new CZ)
    [/^\d[A-Z]{2} \d{4}[A-Z]?$/,    97], // 1AB 2345 or 1AB 2345C (CZ standard)
    [/^\d{2}[A-Z] \d{4}[A-Z]?$/,    95], // 11R 0466 (CZ special)
    [/^\d[A-Z]\d\d{4}$/,             90], // 6P92125 (no space — OCR missed space)
    // ── Croatian / Bosnian / Slovenian ──
    [/^[A-Z]{1,3} \d{3,4} [A-Z]{1,3}$/, 96], // ZG 1234 AB
    // ── Police / emergency ──
    [/^\d{3} \d{3}$/,                95], // 123 456
    // ── German-ish ──
    [/^[A-Z]{1,3}-[A-Z]{1,3} \d{3,4}[A-Z]?$/, 92],
    // ── Generic two-part plates ──
    [/^[A-Z]{2,3} \d{4,5}$/,        85],
    [/^\d{3,5} [A-Z]{2,3}$/,        85],
    [/^[A-Z]{2}\d{3,5}$/,           72],
    [/^\d{3,5}[A-Z]{2}$/,           72],
    [/^[A-Z0-9]{5,9}$/,             45],
  ];

  const lengthBonus = noSpace.length >= 5 && noSpace.length <= 8 ? 3 : 0;

  let best = 0;
  for (const [re, pts] of scored) {
    if (re.test(t)) best = Math.max(best, pts + lengthBonus);
  }
  return best;
}

// ── Best plate from OCR text ──────────────────────────────────────────────────
function extractBest(rawOcr: string): { text: string; score: number } {
  const text = rawOcr.toUpperCase().replace(/[^A-Z0-9\s\n]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = text.split(" ").filter(Boolean);
  const candidates: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    candidates.push(tokens[i]);
    if (i + 1 < tokens.length) candidates.push(tokens[i] + " " + tokens[i+1]);
    if (i + 2 < tokens.length) candidates.push(tokens[i] + " " + tokens[i+1] + " " + tokens[i+2]);
  }
  // Also try merging adjacent tokens without space (handles OCR missing the gap)
  for (let i = 0; i + 1 < tokens.length; i++) {
    candidates.push(tokens[i] + tokens[i+1]);
  }

  let bestScore = 0, bestText = "";
  for (const c of candidates) {
    const s = scorePlate(c);
    if (s > bestScore) { bestScore = s; bestText = c.trim(); }
  }
  return { text: bestText, score: bestScore };
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
        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker("eng", 1, { logger: () => {} });

        const variants = await preprocessImage(file);

        let bestScore = 0;
        let bestPlate = "";

        const byPsm: Record<string, CropVariant[]> = {};
        for (const v of variants) {
          (byPsm[v.psm] ??= []).push(v);
        }

        for (const psm of ["7", "11"] as const) {
          if (cancelled) break;
          const group = byPsm[psm] ?? [];

          await worker.setParameters({
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
            tessedit_pageseg_mode: psm as never,
          });

          for (const { blob } of group) {
            if (cancelled) break;
            const { data: { text } } = await worker.recognize(blob);
            const { text: plate, score } = extractBest(text);
            if (score > bestScore) { bestScore = score; bestPlate = plate; }
            if (bestScore >= 97) break;
          }

          if (bestScore >= 97) break;
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
        <button type="button" onClick={() => onSuggest(detected)}
          className="ml-auto font-medium text-indigo-400 transition-colors hover:text-indigo-200">
          Use this →
        </button>
      )}
    </div>
  );
}
