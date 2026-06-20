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

      // For each region we produce: (a) normal contrast, (b) high contrast, (c) inverted high contrast
      // Narrow horizontal strips (15-20% height) are likely to contain just the plate → use PSM 7 (single line)
      // Wider regions → PSM 11 (sparse text, finds anything)
      const regions = [
        // ── Narrow strips — slide across the plate zone (PSM 7 = single line) ──
        // Rear plate: usually 55-80% down
        { sx: Math.floor(w*0.1), sy: Math.floor(h*0.50), sw: Math.floor(w*0.8), sh: Math.floor(h*0.18), psm: "7" as const },
        { sx: Math.floor(w*0.1), sy: Math.floor(h*0.58), sw: Math.floor(w*0.8), sh: Math.floor(h*0.18), psm: "7" as const },
        { sx: Math.floor(w*0.1), sy: Math.floor(h*0.65), sw: Math.floor(w*0.8), sh: Math.floor(h*0.18), psm: "7" as const },
        { sx: Math.floor(w*0.1), sy: Math.floor(h*0.72), sw: Math.floor(w*0.8), sh: Math.floor(h*0.18), psm: "7" as const },
        // Front plate (middle zone)
        { sx: Math.floor(w*0.1), sy: Math.floor(h*0.30), sw: Math.floor(w*0.8), sh: Math.floor(h*0.18), psm: "7" as const },
        { sx: Math.floor(w*0.1), sy: Math.floor(h*0.38), sw: Math.floor(w*0.8), sh: Math.floor(h*0.18), psm: "7" as const },
        // ── Wider fallback zones — PSM 11 (sparse text) ──
        { sx: Math.floor(w*0.05), sy: Math.floor(h*0.50), sw: Math.floor(w*0.9), sh: Math.floor(h*0.35), psm: "11" as const },
        { sx: 0,                   sy: Math.floor(h*0.60), sw: w,                  sh: Math.floor(h*0.40), psm: "11" as const },
        { sx: 0,                   sy: 0,                   sw: w,                  sh: h,                  psm: "11" as const },
      ];

      let pending = 0;
      const variants: CropVariant[] = [];

      regions.forEach(({ sx, sy, sw, sh, psm }) => {
        // For each region, produce 2 contrast levels
        const contrastLevels = [2.2, 3.5];
        pending += contrastLevels.length;

        contrastLevels.forEach((contrast) => {
          const canvas = document.createElement("canvas");
          const scale = 2;
          canvas.width  = Math.max(1, sw) * scale;
          canvas.height = Math.max(1, sh) * scale;
          const ctx = canvas.getContext("2d")!;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

          // Grayscale + contrast
          const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = id.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
            const c = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
            d[i] = d[i+1] = d[i+2] = c;
          }
          ctx.putImageData(id, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) variants.push({ blob, label: `${psm}-c${contrast}`, psm });
            if (--pending === 0) resolve(variants);
          }, "image/png");
        });
      });
    };
    img.src = url;
  });
}

// ── Plate scoring ─────────────────────────────────────────────────────────────
function scorePlate(raw: string): number {
  const t = raw.toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const noSpace = t.replace(/\s/g, "");

  // Must be 4-10 chars (no spaces)
  if (noSpace.length < 4 || noSpace.length > 10) return 0;

  // Must have at least one letter AND one digit (or be a 6-digit police plate)
  if (!/[A-Z]/.test(t) || !/\d/.test(t)) {
    if (!/^\d{3} \d{3}$/.test(t)) return 0;
  }

  // Patterns ordered by specificity (higher = more confident)
  const scored: [RegExp, number][] = [
    // ── 95-100 pts: highly specific national formats ──
    [/^[A-Z]{1,3} \d{3,4} [A-Z]{1,3}$/, 98], // ZG 1234 AB (HR/BA/SI)  — was 100, reduce slightly so we pick real reads
    [/^\d{3} \d{3}$/,                    95], // 123 456   (CZ/HR police)
    [/^\d[A-Z]{1,2} \d{4}[A-Z]?$/,      97], // 9AI 5648  (CZ 2001) — highest priority Czech
    [/^\d{2}[A-Z] \d{4}[A-Z]?$/,        95], // 11R 0466  (CZ sport/oldtimer)
    [/^[A-Z]{1,3}-[A-Z]{1,3} \d{3,4}[A-Z]?$/, 92], // DE style: B-AB1234
    [/^[A-Z]{2,3} \d{4,5}$/,            85], // XX 1234
    [/^\d{3,5} [A-Z]{2,3}$/,            85], // 12345 AB
    [/^[A-Z]{2}\d{3,5}$/,               72], // compact
    [/^\d{3,5}[A-Z]{2}$/,               72], // compact
    [/^[A-Z0-9]{5,10}$/,                45], // generic fallback
  ];

  // Bonus: strongly prefer candidates whose total char count (no spaces) is 5-8
  // (Very short like "AB 1 C" = 4 chars are likely OCR fragments)
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

        // Group variants by PSM so we can run them in batches
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
            // Very high confidence — stop early
            if (bestScore >= 95) break;
          }

          if (bestScore >= 95) break;
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
