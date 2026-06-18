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

  useEffect(() => {
    if (!file) {
      setStatus("idle");
      setDetected("");
      return;
    }

    let cancelled = false;
    setStatus("scanning");
    setDetected("");

    (async () => {
      try {
        const form = new FormData();
        form.append("image", file);
        const res = await fetch("/api/ocr", { method: "POST", body: form });
        if (cancelled) return;
        if (!res.ok) { setStatus("error"); return; }
        const data = await res.json();
        if (cancelled) return;
        const text = (data.text ?? "").trim();
        setDetected(text);
        setStatus("done");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [file]);

  if (status === "idle") return null;

  if (status === "scanning") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-500">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Scanning plate text…
      </div>
    );
  }

  if (status === "error" || !detected) return null;

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-indigo-900/60 bg-indigo-950/30 px-3 py-2 text-xs">
      <span className="text-zinc-500">OCR detected:</span>
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
