"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "inappropriate", label: "🔞 Inappropriate content",          desc: "Image or content violates community rules" },
  { value: "incorrect",     label: "❌ Incorrect information",           desc: "Wrong plate text, country, car details etc." },
  { value: "missing_model", label: "🚗 Missing vehicle brand / model",   desc: "The car brand or model isn't in the system yet" },
  { value: "other",         label: "💬 Other",                           desc: "Something else that needs staff attention" },
];

export default function ReportButton({ uploadNumericId }: { uploadNumericId: number }) {
  const [open, setOpen]         = useState(false);
  const [category, setCategory] = useState("");
  const [details, setDetails]   = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errMsg, setErrMsg]     = useState("");

  function reset() {
    setOpen(false);
    setCategory("");
    setDetails("");
    setStatus("idle");
    setErrMsg("");
  }

  async function submit() {
    if (!category) return;
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadNumericId, category, details }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("sent");
      } else {
        setErrMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrMsg("Network error — please try again.");
      setStatus("error");
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
        </svg>
        Report
      </button>

      {/* Modal backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">

            {status === "sent" ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-3">✅</div>
                <div className="text-base font-semibold text-zinc-100 mb-1">Report sent</div>
                <p className="text-sm text-zinc-400">Our moderation team has been notified and will review this spot.</p>
                <button
                  onClick={reset}
                  className="mt-5 rounded-xl bg-zinc-800 px-5 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-100">Report this spot</h2>
                  <button onClick={reset} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">✕</button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Category */}
                  <div>
                    <div className="text-xs font-medium text-zinc-400 mb-2">What's the issue?</div>
                    <div className="space-y-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setCategory(c.value)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                            category === c.value
                              ? "border-indigo-600 bg-indigo-950/40 text-zinc-100"
                              : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <div className="text-sm font-medium">{c.label}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{c.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                      Additional details <span className="text-zinc-600">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Add any extra context that'll help mods…"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 resize-none transition-colors"
                    />
                    <div className="text-right text-xs text-zinc-600 mt-1">{details.length}/500</div>
                  </div>

                  {errMsg && <p className="text-xs text-red-400">{errMsg}</p>}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={reset}
                      className="flex-1 rounded-xl border border-zinc-800 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submit}
                      disabled={!category || status === "loading"}
                      className="flex-1 rounded-xl bg-red-600/80 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
                    >
                      {status === "loading" ? "Sending…" : "Send report"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
