"use client";

import { useEffect, useState } from "react";

// ── Image preprocessing ───────────────────────────────────────────────────────
async function preprocessImage(file: File): Promise<{ blob: Blob; label: string }[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;

      const tasks = [
        // Bottom 40% — rear plates
        { sx: 0,                  sy: Math.floor(h * 0.60), sw: w,               sh: Math.floor(h * 0.40), label: "bottom" },
        // Center-bottom band — tighter plate zone
        { sx: Math.floor(w*0.05), sy: Math.floor(h * 0.55), sw: Math.floor(w*0.90), sh: Math.floor(h * 0.35), label: "centre-bottom" },
        // Middle of image — front plates on approaching cars
        { sx: Math.floor(w*0.10), sy: Math.floor(h * 0.30), sw: Math.floor(w*0.80), sh: Math.floor(h * 0.40), label: "middle" },
        // Full image fallback
        { sx: 0,                  sy: 0,                    sw: w,               sh: h,                    label: "full" },
      ];

      let done = 0;
      const variants: { blob: Blob; label: string }[] = [];

      tasks.forEach(({ sx, sy, sw, sh, label }) => {
        const canvas = document.createElement("canvas");
        const scale = 2;
        canvas.width  = Math.max(1, sw) * scale;
        canvas.height = Math.max(1, sh) * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        // Grayscale + contrast boost
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
          const c = Math.min(255, Math.max(0, (gray - 128) * 2.0 + 128));
          d[i] = d[i+1] = d[i+2] = c;
        }
        ctx.putImageData(id, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) variants.push({ blob, label });
          if (++done === tasks.length) resolve(variants);
        }, "image/png");
      });
    };
    img.src = url;
  });
}

// ── Plate scoring ─────────────────────────────────────────────────────────────
// Returns 0 if clearly not a plate, higher = more plate-like
function scorePlate(raw: string): number {
  const t = raw.toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (t.length < 4 || t.length > 14) return 0;

  // Must contain at least one letter and one digit
  if (!/[A-Z]/.test(t) || !/\d/.test(t)) {
    // Exception: police-style "123 456" (all digits with space)
    if (!/^\d{3} \d{3}$/.test(t)) return 0;
  }

  const scored: [RegExp, number][] = [
    // ── Exact multi-country patterns ───────────────────────────────────────
    [/^[A-Z]{1,3} \d{3,4} [A-Z]{1,3}$/,   100], // ZG 1234 AB (HR/BA/SI)
    [/^\d{3} \d{3}$/,                        95], // 123 456   (CZ/HR police)
    [/^\d[A-Z]{1,2} \d{4}$/,                95], // 6SX 2360  (CZ 2001)
    [/^\d{2}[A-Z] \d{4}$/,                  95], // 11R 0466  (CZ sport/oldtimer)
    [/^[A-Z]{1,3}-[A-Z]{1,2} \d{3,4}[A-Z]?$/, 90], // DE style: B-AB1234
    [/^[A-Z]{2,3} \d{3,5}$/,               80], // XX 12345
    [/^\d{3,5} [A-Z]{1,3}$/,               80], // 12345 AB
    [/^[A-Z]{2,3}\d{3,5}$/,               70], // compact XX1234
    [/^\d{3,5}[A-Z]{1,3}$/,               70], // compact 1234AB
    [/^[A-Z0-9]{5,10}$/,                   40], // generic compact
  ];

  let best = 0;
  for (const [re, pts] of scored) {
    if (re.test(t)) { best = Math.max(best, pts); }
  }
  return best;
}

// ── Best plate from OCR text ──────────────────────────────────────────────────
function extractBest(rawOcr: string): string {
  const text = rawOcr.toUpperCase().replace(/[^A-Z0-9\s\n]/g, " ").replace(/\s+/g, " ").trim();
  
  // Split into overlapping n-grams of 1–3 space-separated tokens
  const tokens = text.split(" ");
  const candidates: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    candidates.push(tokens[i]);
    if (i + 1 < tokens.length) candidates.push(tokens[i] + " " + tokens[i+1]);
    if (i + 2 < tokens.length) candidates.push(tokens[i] + " " + tokens[i+1] + " " + tokens[i+2]);
  }

  let bestScore = 0;
  let bestText  = "";
  for (const c of candidates) {
    const s = scorePlate(c);
    if (s > bestScore) { bestScore = s; bestText = c.trim(); }
  }
  return bestScore >= 40 ? bestText : "";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OcrHint({
  file,
  onSuggest,
}: {
  file: File | null;
  onSuggest?: (text: string) => void;
}) {
  const [status, setStatus]   = useState<"idle" | "scanning" | "done" | "error">("idle");
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

        // PSM 11 = sparse text — finds any text anywhere (better for real photos)
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
          tessedit_pageseg_mode: "11" as never,
        });

        const variants = await preprocessImage(file);

        let bestScore  = 0;
        let bestPlate  = "";

        for (const { blob } of variants) {
          if (cancelled) break;
          const { data: { text } } = await worker.recognize(blob);
          const candidate = extractBest(text);
          const score = scorePlate(candidate);
          if (score > bestScore) { bestScore = score; bestPlate = candidate; }
          // Early exit if very confident
          if (bestScore >= 90) break;
        }

        await worker.terminate();
        if (cancelled) return;

        if (!bestPlate) {
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
