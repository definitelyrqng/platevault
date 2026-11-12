"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Open the spot, mark a report done (or reopen it) and delete it. */
export default function ReportActions({ id, status, spotNumericId }: { id: string; status: string; spotNumericId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const done = status === "DONE";

  async function run(init: RequestInit) {
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { ...init, headers: { "Content-Type": "application/json" } });
      if (!res.ok) { setErr("Failed — try again."); return; }
      router.refresh();
    } catch {
      setErr("Failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`/spot/${spotNumericId}`} className={`${btn} border-indigo-700/60 text-indigo-300 hover:bg-indigo-950/30`}>✎ Open spot</a>
      <button type="button" disabled={busy} onClick={() => run({ method: "PATCH", body: JSON.stringify({ action: done ? "reopen" : "resolve" }) })}
        className={`${btn} ${done ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/30"}`}>
        {done ? "Reopen" : "✓ Mark done"}
      </button>
      <button type="button" disabled={busy} onClick={() => { if (confirm("Delete this report?")) run({ method: "DELETE" }); }}
        className={`${btn} border-red-900/60 text-red-300 hover:bg-red-950/30`}>✕ Delete report</button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}
