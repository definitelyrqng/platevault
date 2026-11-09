"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Restore / delete a hidden spot from the admin hub. Same APIs as the per-spot panel. */
export default function HiddenSpotActions({ uploadId, canDelete }: { uploadId: string; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState("");

  async function run(url: string, init: RequestInit) {
    setBusy(true); setErr("");
    try {
      const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
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
      <button type="button" disabled={busy} className={`${btn} border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/30`}
        onClick={() => run(`/api/admin/uploads/${uploadId}/visibility`, { method: "PATCH", body: JSON.stringify({ hidden: false, reason: null }) })}>
        Restore
      </button>
      {canDelete && (confirming ? (
        <>
          <button type="button" disabled={busy} className={`${btn} border-red-800/60 bg-red-950/40 text-red-200 hover:bg-red-900/40`}
            onClick={() => run(`/api/uploads/${uploadId}`, { method: "DELETE", body: JSON.stringify({ reason: null }) })}>
            {busy ? "Deleting…" : "Delete forever"}
          </button>
          <button type="button" className={`${btn} border-zinc-700 text-zinc-300 hover:bg-zinc-800`} onClick={() => setConfirming(false)}>Cancel</button>
        </>
      ) : (
        <button type="button" className={`${btn} border-red-900/60 text-red-300 hover:bg-red-950/40`} onClick={() => setConfirming(true)}>Delete</button>
      ))}
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}
