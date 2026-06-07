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
}: {
  uploadId: string;
  initialBrand: string;
  initialModel: string;
  initialGeneration: string;
  initialTrim: string;
  initialColor: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [generation, setGeneration] = useState(initialGeneration);
  const [trim, setTrim] = useState(initialTrim);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const models     = brand                    ? getModels(brand)                  : [];
  const generations = brand && model          ? getGenerations(brand, model)      : [];
  const trims      = brand && model && generation ? getTrims(brand, model, generation)  : [];
  const colors     = brand && model && generation ? getColors(brand, model, generation) : ["Custom color", "Custom wrap"];

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

  async function deletePost() {
    if (!confirm("Delete this spot permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, { method: "DELETE" });
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

      {open && (
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

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveDetails}
              disabled={saving}
              className="flex-1 rounded-xl bg-zinc-100 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save details"}
            </button>
            <button
              onClick={deletePost}
              disabled={deleting}
              className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/60 disabled:opacity-50"
            >
              {deleting ? "…" : "Delete post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
