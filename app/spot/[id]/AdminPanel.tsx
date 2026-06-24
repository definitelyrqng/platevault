"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CompanyPicker from "@/app/components/CompanyPicker";

const INPUT = "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-amber-700/60 focus:bg-zinc-900/80 disabled:opacity-30 disabled:cursor-not-allowed placeholder:text-zinc-700";

type BrandRow = { id: number; name: string };
type ModelRow  = { id: number; name: string };
type GenRow    = { id: number; name: string };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{children}</p>;
}

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
  const [tab, setTab]   = useState<"details" | "moderation">("details");

  // Car details
  const [brand,      setBrand]      = useState(initialBrand);
  const [model,      setModel]      = useState(initialModel);
  const [generation, setGeneration] = useState(initialGeneration);
  const [color,      setColor]      = useState(initialColor);
  const [badge,      setBadge]      = useState(initialBadge);
  const [companyId,  setCompanyId]  = useState<string | null>(initialCompanyId ?? null);
  const [saving,     setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle");

  // Visibility
  const [hidden,       setHidden]       = useState(initialHidden);
  const [hideReason,   setHideReason]   = useState("");
  const [toggling,     setToggling]     = useState(false);

  // Delete
  const [delPhase,     setDelPhase]     = useState<"idle" | "confirm">("idle");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState("");

  // Catalog
  const [brands,  setBrands]  = useState<BrandRow[]>([]);
  const [models,  setModels]  = useState<ModelRow[]>([]);
  const [gens,    setGens]    = useState<GenRow[]>([]);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/catalog").then(r => r.json()).then((d: BrandRow[]) => {
      setBrands(d);
      const f = d.find(b => b.name === initialBrand);
      if (f) setBrandId(f.id);
    }).catch(() => {});
  }, [initialBrand]);

  useEffect(() => {
    if (!brandId) { setModels([]); setGens([]); return; }
    fetch(`/api/catalog/brands/${brandId}/models`).then(r => r.json()).then((d: ModelRow[]) => {
      setModels(d);
      const f = d.find(m => m.name === initialModel);
      if (f) setModelId(f.id);
    }).catch(() => {});
  }, [brandId, initialModel]);

  useEffect(() => {
    if (!modelId) { setGens([]); return; }
    fetch(`/api/catalog/models/${modelId}/generations`).then(r => r.json()).then(setGens).catch(() => {});
  }, [modelId]);

  function onBrandChange(v: string) {
    setBrand(v); setModel(""); setGeneration(""); setModels([]); setGens([]); setModelId(null);
    setBrandId(brands.find(b => b.name === v)?.id ?? null);
  }
  function onModelChange(v: string) {
    setModel(v); setGeneration(""); setGens([]); setModelId(null);
    setModelId(models.find(m => m.name === v)?.id ?? null);
  }

  async function save() {
    setSaving(true); setSaveStatus("idle");
    const res = await fetch(`/api/uploads/${uploadId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, model, generation, trim: initialTrim, color, badge, companyId }),
    });
    setSaveStatus(res.ok ? "ok" : "err");
    if (res.ok) { router.refresh(); setTimeout(() => setSaveStatus("idle"), 2500); }
    setSaving(false);
  }

  async function toggleVisibility() {
    setToggling(true);
    const res = await fetch(`/api/admin/uploads/${uploadId}/visibility`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !hidden, reason: hideReason.trim() || null }),
    });
    if (res.ok) { setHidden(v => !v); setHideReason(""); router.refresh(); }
    setToggling(false);
  }

  async function doDelete() {
    setDeleting(true); setDeleteError("");
    const res = await fetch(`/api/uploads/${uploadId}`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: deleteReason.trim() || null }),
    });
    if (!res.ok) { setDeleteError("Delete failed — try again."); setDeleting(false); return; }
    window.location.href = "/home";
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-b from-amber-950/20 to-zinc-900/30 shadow-lg shadow-amber-950/10">

      {/* ── Header ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-amber-950/10"
      >
        {/* Icon */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-800/40 bg-amber-950/60">
          <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </span>

        <div className="flex-1 text-left">
          <p className="text-xs font-bold tracking-widest text-amber-400/90 uppercase">Admin Panel</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Moderator controls</p>
        </div>

        {hidden && (
          <span className="flex items-center gap-1 rounded-full border border-red-900/50 bg-red-950/40 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            Hidden
          </span>
        )}

        <svg className={`h-4 w-4 text-zinc-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* ── Body ── */}
      {open && (
        <div className="border-t border-amber-900/20">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800/60 bg-zinc-950/40">
            {(["details", "moderation"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative flex-1 py-3 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                  tab === t ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {t}
                {tab === t && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── Details tab ── */}
            {tab === "details" && (
              <div className="space-y-5">
                {/* Car identity */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 3v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Car identity</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <FieldLabel>Brand</FieldLabel>
                      <select value={brand} onChange={e => onBrandChange(e.target.value)} className={INPUT}>
                        <option value="">— no brand —</option>
                        {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Model</FieldLabel>
                      <select value={model} onChange={e => onModelChange(e.target.value)} disabled={!brand || models.length === 0} className={INPUT}>
                        <option value="">— no model —</option>
                        {models.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Generation</FieldLabel>
                      <select value={generation} onChange={e => setGeneration(e.target.value)} disabled={!model || gens.length === 0} className={INPUT}>
                        <option value="">— no generation —</option>
                        {gens.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <FieldLabel>Badge</FieldLabel>
                        <input value={badge} onChange={e => setBadge(e.target.value)} placeholder="3.0 TDI…" maxLength={30} className={INPUT} />
                      </div>
                      <div>
                        <FieldLabel>Color</FieldLabel>
                        <input value={color} onChange={e => setColor(e.target.value)} placeholder="Mineral White…" className={INPUT} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Company</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                  <CompanyPicker value={companyId} onChange={id => setCompanyId(id)} />
                </div>

                {/* Save button */}
                <button
                  onClick={save}
                  disabled={saving}
                  className={`group relative w-full overflow-hidden rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                    saveStatus === "ok"
                      ? "border border-emerald-800/60 bg-emerald-950/40 text-emerald-400"
                      : saveStatus === "err"
                      ? "border border-red-800/60 bg-red-950/40 text-red-400"
                      : "border border-amber-800/40 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50"
                  }`}
                >
                  <span className="relative z-10">
                    {saving ? "Saving…" : saveStatus === "ok" ? "✓ Saved" : saveStatus === "err" ? "✗ Error" : "Save changes"}
                  </span>
                  {!saving && saveStatus === "idle" && (
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-500/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                  )}
                </button>
              </div>
            )}

            {/* ── Moderation tab ── */}
            {tab === "moderation" && (
              <div className="space-y-5">
                {/* Visibility */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Visibility</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${hidden ? "bg-red-950/60 text-red-400 border border-red-900/40" : "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40"}`}>
                      {hidden ? "Hidden" : "Visible"}
                    </span>
                  </div>

                  {hidden ? (
                    <div className="flex items-start gap-3 rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3">
                      <svg className="h-4 w-4 shrink-0 text-red-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                      <p className="text-xs text-red-300/80">This spot is hidden from public view and won't appear in search or feeds.</p>
                    </div>
                  ) : (
                    <div>
                      <FieldLabel>Hide reason <span className="normal-case font-normal text-zinc-700">(optional)</span></FieldLabel>
                      <input value={hideReason} onChange={e => setHideReason(e.target.value)} placeholder="Under review, duplicate, violates rules…" maxLength={280} className={INPUT} />
                    </div>
                  )}

                  <button
                    onClick={toggleVisibility}
                    disabled={toggling}
                    className={`w-full rounded-xl border py-2.5 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40 ${
                      hidden
                        ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40"
                        : "border-amber-800/40 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40"
                    }`}
                  >
                    {toggling ? "…" : hidden ? "↑ Restore visibility" : "↓ Hide this spot"}
                  </button>
                </div>

                {/* Danger zone */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Danger zone</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>

                  {delPhase === "idle" ? (
                    <button
                      onClick={() => setDelPhase("confirm")}
                      className="w-full rounded-xl border border-red-900/30 bg-red-950/10 py-2.5 text-xs font-bold uppercase tracking-widest text-red-500/80 hover:bg-red-950/25 hover:text-red-400 hover:border-red-900/50 transition-all"
                    >
                      Delete spot permanently
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-900/40 bg-red-950/10 overflow-hidden">
                      <div className="flex items-center gap-2 bg-red-950/30 px-4 py-2.5 border-b border-red-900/30">
                        <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Confirm deletion</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <p className="text-xs text-red-300/70 leading-relaxed">
                          Permanently deletes the spot and image. <strong className="text-red-300">Cannot be undone.</strong>
                        </p>
                        <div>
                          <FieldLabel>Reason <span className="normal-case font-normal text-zinc-700">(shown to user)</span></FieldLabel>
                          <textarea
                            value={deleteReason}
                            onChange={e => setDeleteReason(e.target.value)}
                            placeholder="Duplicate, blurry image, violates community rules…"
                            maxLength={280}
                            rows={2}
                            className={INPUT + " resize-none"}
                          />
                          <p className="text-right text-[10px] text-zinc-700 mt-1">{deleteReason.length}/280</p>
                        </div>
                        {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setDelPhase("idle"); setDeleteReason(""); setDeleteError(""); }}
                            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={doDelete}
                            disabled={deleting}
                            className="flex-1 rounded-xl border border-red-800/60 bg-red-950/50 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900/40 transition-colors disabled:opacity-40"
                          >
                            {deleting ? "Deleting…" : "Delete forever"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
