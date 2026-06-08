"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRANDS, getModels, getGenerations, getTrims, getColors } from "@/app/lib/carData";

export default function AdminPanel({
  uploadId,
  initialBrand,
  initialModel,
  initialGeneration,
  initialTrim,
  initialColor,
  initialHidden,
}: {
  uploadId: string;
  initialBrand: string;
  initialModel: string;
  initialGeneration: string;
  initialTrim: string;
  initialColor: string;
  initialHidden: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [generation, setGeneration] = useState(initialGeneration);
  const [trim, setTrim] = useState(initialTrim);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Delete confirmation state
  const [deleteMode, setDeleteMode] = useState(false);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Visibility state
  const [hidden, setHidden] = useState(initialHidden);
  const [hideReason, setHideReason] = useState("");
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const models      = brand                         ? getModels(brand)                       : [];
  const generations = brand && model                ? getGenerations(brand, model)           : [];
  const trims       = brand && model && generation  ? getTrims(brand, model, generation)    : [];
  const colors      = brand && model && generation  ? getColors(brand, model, generation)   : ["Custom color", "Custom wrap"];

  function onBrandChange(v: string) {
    setBrand(v); setModel(""); setGeneration(""); setTrim(""); setColor("");
  }
  function onModelChange(v: string) {
    setModel(v); setGeneration(""); setTrim(""); setColor("");
  }
  function onGenerationChange(v: string) {
    setGeneration(v); setTrim(""); setColor("");
  }

  async function saveDetails() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, generation, trim, color }),
      });
      if (!res.ok) { setError("Failed to save."); return; }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility() {
    setTogglingVisibility(true); setError("");
    try {
      const res = await fetch(`/api/admin/uploads/${uploadId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !hidden, reason: hideReason.trim() || null }),
      });
      if (!res.ok) { setError("Failed to update visibility."); return; }
      setHidden((v) => !v);
      setHideReason("");
      router.refresh();
    } finally { setTogglingVisibility(false); }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      if (!res.ok) { setError("Failed to delete."); return; }
      window.location.href = "/home";
    } finally {
      setDeleting(false);
    }
  }

  const selectCls = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 disabled:opacity-40";

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400"
      >
        <span>⚙ Admin Panel</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && !deleteMode && (
        <div className="mt-4 space-y-3">
          {/* Brand */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Brand</label>
            <select value={brand} onChange={(e) => onBrandChange(e.target.value)} className={selectCls}>
              <option value="">— select brand —</option>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Model</label>
            <select value={model} onChange={(e) => onModelChange(e.target.value)} disabled={!brand} className={selectCls}>
              <option value="">— select model —</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Generation */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Generation</label>
            <select value={generation} onChange={(e) => onGenerationChange(e.target.value)} disabled={!model} className={selectCls}>
              <option value="">— select generation —</option>
              {generations.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Trim */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Trim</label>
            <select value={trim} onChange={(e) => setTrim(e.target.value)} disabled={!generation} className={selectCls}>
              <option value="">— select trim —</option>
              {trims.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Color</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} disabled={!generation} className={selectCls}>
              <option value="">— select color —</option>
              {colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && <p className="text-xs text-emerald-400">Saved!</p>}

          {/* Hide / show */}
          <div className="pt-1 space-y-2">
            {hidden && (
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-3 py-1.5 text-xs text-amber-400">
                ⚠ This spot is currently hidden from non-moderators.
              </div>
            )}
            {!hidden && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Hide reason (optional, shown to user)</label>
                <input
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  placeholder="e.g. Under review…"
                  maxLength={280}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </div>
            )}
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`w-full rounded-xl border py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                hidden
                  ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/60"
                  : "border-amber-900/50 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40"
              }`}
            >
              {togglingVisibility ? "…" : hidden ? "Show spot (restore visibility)" : "Hide spot from public"}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveDetails}
              disabled={saving}
              className="flex-1 rounded-xl bg-zinc-100 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save details"}
            </button>
            <button
              onClick={() => { setDeleteMode(true); setError(""); }}
              className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/60"
            >
              Delete post
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation panel */}
      {open && deleteMode && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-red-300 font-medium">
            This will permanently delete the spot and remove the image from storage. The user will be notified.
          </p>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Reason <span className="text-zinc-600">(shown to user — leave blank for generic message)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Duplicate spot, blurry image, violates rules…"
              maxLength={280}
              rows={3}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 resize-none"
            />
            <div className="text-right text-[10px] text-zinc-600 mt-0.5">{reason.length}/280</div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setDeleteMode(false); setReason(""); setError(""); }}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 rounded-xl border border-red-900/50 bg-red-950/60 py-2 text-xs font-medium text-red-300 hover:bg-red-950 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete permanently"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
