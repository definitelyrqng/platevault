"use client";
import { useState } from "react";

export default function MaintenanceToggle({
  initialMode,
  initialMsg,
}: {
  initialMode: boolean;
  initialMsg: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const [msg, setMsg]   = useState(initialMsg);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function toggle() {
    setSaving(true);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenanceMode: !mode, maintenanceMsg: msg }),
    });
    if (res.ok) {
      const data = await res.json();
      setMode(data.maintenanceMode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function saveMsg() {
    setSaving(true);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenanceMsg: msg }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
      {/* Status row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Maintenance Mode</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Blocks all uploads for regular users. Only you can still post.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            mode ? "border-amber-500 bg-amber-500" : "border-zinc-700 bg-zinc-800"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
              mode ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Mode badge */}
      <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold ${
        mode
          ? "bg-amber-950/60 text-amber-300 border border-amber-700/40"
          : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40"
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${mode ? "bg-amber-400" : "bg-zinc-600"}`} />
        {mode ? "MAINTENANCE ACTIVE" : "SITE OPERATIONAL"}
      </div>

      {/* Banner message editor */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500 font-medium">Banner message</label>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-700">{msg.length}/500</span>
          <button
            onClick={saveMsg}
            disabled={saving}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors disabled:opacity-50"
          >
            Save message
          </button>
        </div>
      </div>

      {saved && (
        <p className="text-xs text-emerald-400">✓ Saved</p>
      )}
    </div>
  );
}
