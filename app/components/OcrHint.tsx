"use client";

import { useEffect, useState } from "react";

// Pre-process image: try multiple crops and pick the best plate-like result
async function preprocessImage(file: File): Promise<{ blob: Blob; label: string }[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const variants: { blob: Blob; label: string }[] = [];
      const tasks: { sx: number; sy: number; sw: number; sh: number; label: string }[] = [
        // Bottom-third crop — where rear plates usually are
        { sx: 0, sy: Math.floor(h * 0.6), sw: w, sh: Math.floor(h * 0.4), label: "bottom" },
        // Centre-bottom strip — tighter plate zone
        { sx: Math.floor(w * 0.1), sy: Math.floor(h * 0.55), sw: Math.floor(w * 0.8), sh: Math.floor(h * 0.35), label: "centre-bottom" },
        // Full image fallback
        { sx: 0, sy: 0, sw: w, sh: h, label: "full" },
      ];

      let done = 0;
      tasks.forEach(({ sx, sy, sw, sh, label }) => {
        const canvas = document.createElement("canvas");
        const scale = 2; // upscale for better OCR
        canvas.width = sw * scale;
        canvas.height = sh * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // Draw cropped region scaled up
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        // Boost contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
          d[i] = d[i + 1] = d[i + 2] = contrasted;
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) variants.push({ blob, label });
          if (++done === tasks.length) resolve(variants);
        }, "image/png");
      });
    };
    img.src = url;
  });
}

function extractPlate(raw: string): string {
  const text = raw.toUpperCase().replace(/[^A-Z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim();

  const patterns = [
    /\b([A-Z]{1,3})\s+(\d{3,4})\s+([A-Z]{1,3})\b/,  // ZG 1234 AB
    /\b(\d{3})\s+(\d{3})\b/,                           // 123 456 (police)
    /\b([A-Z]{1,3})\s+(\d{3,4})\b/,                   // ZG 1234
    /\b(\d{3,4})\s+([A-Z]{1,3})\b/,                   // 1234 AB
    /\b([A-Z0-9]{5,9})\b/,                             // compact
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].trim();
  }
  return "";
}

export default function OcrHint({
  file,
  onSuggest,
}: {
  file: File | null;
  onSuggest?: (text: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
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
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ",
          tessedit_pageseg_mode: "7" as never, // single text line
        });

        const variants = await preprocessImage(file);

        let best = "";
        for (const { blob } of variants) {
          if (cancelled) break;
          const { data: { text } } = await worker.recognize(blob);
          const candidate = extractPlate(text);
          // Prefer candidates that match the detailed 3-part plate pattern
          if (candidate && /[A-Z].*\d.*[A-Z]|^\d{3} \d{3}$/.test(candidate.replace(/\s/g, " "))) {
            best = candidate;
            break;
          }
          if (candidate && !best) best = candidate;
        }

        await worker.terminate();
        if (cancelled) return;

        if (!best) { setErrorMsg("No plate detected — try a clearer photo"); setStatus("error"); return; }
        setDetected(best);
        setStatus("done");
      } catch (e: unknown) {
        if (!cancelled) { setErrorMsg(e instanceof Error ? e.message : "OCR failed"); setStatus("error"); }
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
