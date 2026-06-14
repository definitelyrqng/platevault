"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CompanyPicker from "@/app/components/CompanyPicker";

const FIELD = "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600 focus:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed placeholder:text-zinc-600";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">{children}</label>;
}

type BrandRow = { id: number; name: string };
type ModelRow  = { id: number; name: string };
type GenRow    = { id: number; name: string };

export default function AdminPanel({
  uploadId,
  initialBrand,
  initialModel,
  initialGeneration,
  initialTrim,
  initialColor,
  initialBadge,
  initialHidden,
  initialCompanyId,
}: {
  uploadId: string;
  initialBrand: string;
  initialModel: string;
  initialGeneration: string;
  initialTrim: string;
  initialColor: string;
  initialBadge: string;
  initialHidden: boolean;
  initialCompanyId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brand,      setBrand]      = useState(initialBrand);
  const [model,      setModel]      = useState(initialModel);
  const [generation, setGeneration] = useState(initialGeneration);
  const [color,      setColor]      = useState(initialColor);
  const [badge,      setBadge]      = useState(initialBadge);
  const [companyId,  setCompanyId]  = useState<string | null>(initialCompanyId ?? null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [saved,      setSaved]      = useState(false);

  const [deleteMode, setDeleteMode] = useState(false);
  const [reason,     setReason]     = useState("");
  const [deleting,   setDeleting]   = useState(false);

  const [hidden,             setHidden]             = useState(initialHidden);
  const [hideReason,         setHideReason]         = useState("");
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Dynamic catalog data
  const [brands,  setBrands]  = useState<BrandRow[]>([]);
  const [models,  setModels]  = useState<ModelRow[]>([]);
  const [gens,    setGens]    = useState<GenRow[]>([]);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);

  // Load brands on mount
  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) => {
        setBrands(data);
        // Resolve initial brandId
        if (initialBrand) {
          const found = data.find((b) => b.name === initialBrand);
          if (found) setBrandId(found.id);
        }
      })
      .catch(() => {});
  }, [initialBrand]);

  // Load models when brandId changes
  useEffect(() => {
    if (!brandId) { setModels([]); setGens([]); return; }
    fetch(`/api/catalog/brands/${brandId}/models`)
      .then((r) => r.json())
      .then((data: ModelRow[]) => {
        setModels(data);
        if (initialModel && brandId) {
          const found = data.find((m) => m.name === initialModel);
          if (found) setModelId(found.id);
        }
      })
      .catch(() => {});
  }, [brandId, initialModel]);

  // Load generations when modelId changes
  useEffect(() => {
    if (!modelId) { setGens([]); return; }
    fetch(`/api/catalog/models/${modelId}/generations`)
      .then((r) => r.json())
      .then((data: GenRow[]) => setGens(data))
      .catch(() => {});
  }, [modelId]);

  function onBrandChange(v: string) {
    setBrand(v);
    setModel(""); setGeneration(""); setColor(""); setBadge("");
    setModels([]); setGens([]); setModelId(null);
    const found = brands.find((b) => b.name === v);
    setBrandId(found?.id ?? null);
  }

  function onModelChange(v: string) {
    setModel(v);
    setGeneration(""); setColor(""); setBadge("");
    setGens([]); setModelId(null);
    const found = models.find((m) => m.name === v);
    setModelId(found?.id ?? null);
  }

  function onGenerationChange(v: string) {
    setGeneration(v); setColor("");
  }

  async function saveDetails() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, generation, trim: initialTrim, color, badge, companyId }),
      });
      if (!res.ok) { setError("Failed to save."); return; }
      setSaved(true);
      router.refresh();
    } finally { setSaving(false); }
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
    } finally { setDeleting(false); }
  }

  return (
    <div className="rounded-2xl border border-amber-900/30 bg-amber-950/10 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-amber-500"
      >
        <span>Admin Panel</span>
        <span className="text-amber-700">{open ? "▲" : "▼"}</span>
      </button>

      {open && !deleteMode && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Brand</Label>
              <select value={brand} onChange={(e) => onBrandChange(e.target.value)} className={FIELD}>
                <option value="">Select brand...</option>
                {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <Label>Model</Label>
              <select value={model} onChange={(e) => onModelChange(e.target.value)} disabled={!brand || models.length === 0} className={FIELD}>
                <option value="">Select model...</option>
                {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <Label>Generation</Label>
              <select value={generation} onChange={(e) => onGenerationChange(e.target.value)} disabled={!model || gens.length === 0} className={FIELD}>
                <option value="">Select generation...</option>
                {gens.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </div>

            <div>
              <Label>Badge</Label>
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="3.0 TDI, RS6..."
                maxLength={30}
                className={FIELD}
              />
            </div>

            <div>
              <Label>Color</Label>
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Obsidian Black..."
                className={FIELD}
              />
            </div>

            <div className="col-span-2">
              <Label>Company</Label>
              <CompanyPicker
                value={companyId}
                onChange={(id) => setCompanyId(id)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && <p className="text-xs text-emerald-400">Saved!</p>}

          <div className="pt-1 space-y-2">
            {hidden && (
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-400">
                This spot is hidden from non-moderators.
              </div>
            )}
            {!hidden && (
              <div>
                <Label>Hide reason (optional)</Label>
                <input
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  placeholder="e.g. Under review..."
                  maxLength={280}
                  className={FIELD}
                />
              </div>
            )}
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`w-full rounded-xl border py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                hidden
                  ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/60"
                  : "border-amber-900/40 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40"
              }`}
            >
              {togglingVisibility ? "..." : hidden ? "Restore visibility" : "Hide spot"}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveDetails}
              disabled={saving}
              className="flex-1 rounded-xl bg-zinc-100 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save details"}
            </button>
            <button
              onClick={() => { setDeleteMode(true); setError(""); }}
              className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {open && deleteMode && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-red-300/80">
            This permanently deletes the spot and removes the image. The user will be notified.
          </p>
          <div>
            <Label>Reason <span className="normal-case text-zinc-600 font-normal">(optional — shown to user)</span></Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Duplicate spot, blurry image, violates rules..."
              maxLength={280}
              rows={3}
              className={FIELD + " resize-none"}
            />
            <div className="text-right text-[10px] text-zinc-700 mt-0.5">{reason.length}/280</div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setDeleteMode(false); setReason(""); setError(""); }}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 rounded-xl border border-red-900/50 bg-red-950/50 py-2 text-xs font-medium text-red-300 hover:bg-red-950 transition-colors disabled:opacity-40"
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
