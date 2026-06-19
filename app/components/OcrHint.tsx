"use client";

import { useEffect, useState } from "react";

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
    if (!file) {
      setStatus("idle");
      setDetected("");
      setErrorMsg("");
      return;
    }

    let cancelled = false;
    setStatus("scanning");
    setDetected("");
    setErrorMsg("");

    (async () => {
      try {
        // Run OCR in the browser — model is cached in IndexedDB after first load
        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker("eng", 1, {
          logger: () => {}, // suppress progress logs
        });
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ",
        });
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();

        if (cancelled) return;

        const cleaned = text
          .toUpperCase()
          .replace(/[^A-Z0-9 -]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (!cleaned) {
          setErrorMsg("No text detected");
          setStatus("error");
          return;
        }
        setDetected(cleaned);
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

  if (status === "scanning") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-500">
        <svg className="h-3 w-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Scanning plate text… <span className="text-zinc-700">(first scan downloads model)</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-400">
        ⚠ OCR: {errorMsg}
      </div>
    );
  }

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
